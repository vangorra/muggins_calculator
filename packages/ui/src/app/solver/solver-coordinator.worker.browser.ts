import { expose, wrap, Remote } from 'comlink';
import type { Endpoint } from 'comlink';
import PQueue from 'p-queue';
import {
  commonWorkerFunctions,
  CalculateEquationResult,
  MugginsSolverCalculateConfig,
} from '@muggins_calculator/common';
import { WORKER_COUNT } from './solver-constants';

type WorkerApi = Remote<typeof commonWorkerFunctions>;

interface PooledWorker {
  readonly api: WorkerApi;
  busy: boolean;
}

export interface CoordinatorConfig {
  readonly calculateConfig: MugginsSolverCalculateConfig;
}

export interface CoordinatorProgress {
  readonly duration: number;
  readonly completedTasks: number;
  readonly remainingTasks: number;
  readonly totalTasks: number;
  readonly percentage: number;
  readonly estimatedTimeToCompletion: number;
}

let pool: PooledWorker[] = [];
let queue: PQueue | undefined;
let cancelled = false;

function initializePool(ports: MessagePort[]): void {
  pool = ports.map((port) => {
    port.start();
    return {
      api: wrap<typeof commonWorkerFunctions>(port as unknown as Endpoint),
      busy: false,
    };
  });
}

function clearQueue(): void {
  queue?.pause();
  queue?.clear();
  pool.forEach((w) => (w.busy = false));
}

function cancel(): void {
  cancelled = true;
  clearQueue();
}

async function queueWork<T>(fn: (api: WorkerApi) => Promise<T>): Promise<T> {
  if (!queue) throw new Error('Queue not initialized');
  return queue.add(async () => {
    const pooledWorker = pool.find((w) => !w.busy)!;
    pooledWorker.busy = true;
    try {
      return await fn(pooledWorker.api);
    } finally {
      pooledWorker.busy = false;
    }
  }) as Promise<T>;
}

async function calculate(
  config: CoordinatorConfig,
  progressCallback: (progress: CoordinatorProgress) => void
): Promise<CalculateEquationResult[]> {
  cancelled = false;
  clearQueue();
  queue = new PQueue({ concurrency: WORKER_COUNT });

  let completedTasks = 0;
  let totalTasks = 2;
  const startTime = Date.now();

  const { calculateConfig } = config;

  progressCallback({
    duration: 0,
    completedTasks: 0,
    remainingTasks: 0,
    totalTasks,
    percentage: 0,
    estimatedTimeToCompletion: 0,
  });

  // Step 1: Get face and operation permutations.
  const { facePermutations, operationPermutations } = await queueWork((api) =>
    api.getFaceAndOperationPermutations(calculateConfig)
  );
  completedTasks += 1;

  if (cancelled) return [];

  // Step 2: Chunk the work and dispatch to workers.
  const chunkSize = Math.max(
    1,
    Math.ceil(facePermutations.length / (WORKER_COUNT * 2))
  );
  const chunks: typeof facePermutations[] = [];
  for (let i = 0; i < facePermutations.length; i += chunkSize) {
    chunks.push(facePermutations.slice(i, i + chunkSize));
  }

  const workPromises = chunks.map((chunk) => {
    totalTasks += 1;

    const taskPromise = queueWork((api) =>
      api.calculateFromFaceAndOperationPermutations(
        calculateConfig,
        chunk,
        operationPermutations
      )
    );

    return (async () => {
      try {
        const arr = await taskPromise;

        const remainingTasks = totalTasks - completedTasks;
        const averageTimePerTask = (Date.now() - startTime) / completedTasks;
        const estimatedTimeToCompletion =
          averageTimePerTask * (remainingTasks - 2) +
          averageTimePerTask * 3 +
          averageTimePerTask * 34 +
          averageTimePerTask * 2.5;

        progressCallback({
          duration: Date.now() - startTime,
          completedTasks,
          remainingTasks,
          totalTasks,
          percentage: completedTasks / totalTasks,
          estimatedTimeToCompletion,
        });

        return arr;
      } finally {
        completedTasks += 1;
      }
    })();
  });

  // Step 3: Combine and deduplicate results, then sort by total for display.
  const combined = commonWorkerFunctions.combineResults(
    await Promise.all(workPromises)
  );
  const results = combined.sort(
    (a, b) =>
      a.total - b.total || a.sortableEquation.localeCompare(b.sortableEquation)
  );

  completedTasks += 1;
  progressCallback({
    duration: Date.now() - startTime,
    completedTasks,
    remainingTasks: 0,
    totalTasks,
    percentage: 1,
    estimatedTimeToCompletion: 0,
  });

  return results;
}

const coordinatorApi = {
  initializePool,
  calculate,
  cancel,
};

export type CoordinatorApi = typeof coordinatorApi;

expose(coordinatorApi);
