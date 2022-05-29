import {
  CalculateEquationResult,
  commonWorkerFunctions,
  MugginsSolverCalculateConfig,
  MugginsSolverConfig,
} from './solver-common';
import {
  emitProgressStatusRoot,
  PooledExecutor,
  pooledFunctions,
  PooledWorkerClientFunctionsType,
  ProgressStatus,
} from './worker-utils';
import { solverCalculateWorkerFactory } from './solver-calculate-worker-factory';
import { solverCommonWorkerFactory } from './solver-common-worker-factory';
import { chunk } from 'lodash';
import { Subject } from 'rxjs';

const localProcessorGenerator = () => new PooledExecutor.LocalProcessor();

const calculateProcessorGenerator = () =>
  new PooledExecutor.WebWorkerProcessor(solverCalculateWorkerFactory);

const commonsProcessorGenerator = () =>
  new PooledExecutor.WebWorkerProcessor(solverCommonWorkerFactory);

function getProcessorGenerator(
  solverConfig: MugginsSolverConfig,
  useCommons: boolean
): () => PooledExecutor.Processor {
  if (!solverConfig.useWorker) {
    return localProcessorGenerator;
  }

  if (useCommons) {
    return commonsProcessorGenerator;
  }

  return calculateProcessorGenerator;
}

/**
 * Main solver that can use web workers to distribute the load of calculating solutions.
 */
export class MugginsSolver {
  private readonly pooledExecutor;

  private readonly pooledCommonWorkerFunctions;

  private readonly arraySplitGroupSize: number;

  private readonly currentStatus: ProgressStatus = {
    current: 0,
    buffer: 0,
    total: 100,
  };

  public readonly status = new Subject<ProgressStatus>();

  constructor(
    private readonly solverConfig: MugginsSolverConfig,
    private readonly shouldDebug = false
  ) {
    this.pooledExecutor = new PooledExecutor(
      getProcessorGenerator(solverConfig, true),
      solverConfig.useWorker ? solverConfig.workerCount : 1
    );

    this.pooledCommonWorkerFunctions = pooledFunctions(
      this.pooledExecutor,
      commonWorkerFunctions
    ) as PooledWorkerClientFunctionsType<typeof commonWorkerFunctions>;

    this.arraySplitGroupSize = this.solverConfig.workerCount * 2;
  }

  private debug(...args: any[]) {
    if (this.shouldDebug) {
      console.debug(...args);
    }
  }

  private incrementBuffer(count: number) {
    this.currentStatus.buffer += count;
    this.status.next({
      ...this.currentStatus,
    });
  }

  private incrementProgress(count: number) {
    this.currentStatus.current += count;
    this.status.next({
      ...this.currentStatus,
    });
  }

  private monitorProgressIncrementor<T>(target: T, increment: number): T {
    if (Array.isArray(target)) {
      if (target[0] instanceof Promise) {
        return target.map((item) =>
          this.monitorProgressIncrementor(item, increment)
        ) as any as T;
      } else {
        this.incrementProgress(increment * target.length);
        return target;
      }
    } else if (target instanceof Promise) {
      return target.finally(() =>
        this.incrementProgress(increment)
      ) as any as T;
    } else {
      this.incrementProgress(increment);
      return target;
    }
  }

  private monitorProgress<T>(
    target: Promise<T>,
    ratioOfTotal: number
  ): Promise<T>;
  private monitorProgress<T>(
    target: Promise<T>[],
    ratioOfTotal: number
  ): Promise<T>[];
  private monitorProgress<T>(target: T, ratioOfTotal: number): T;
  private monitorProgress<T>(target: T, ratioOfTotal: number): T {
    this.incrementBuffer(ratioOfTotal * 100);
    if (Array.isArray(target)) {
      return this.monitorProgressIncrementor(
        target,
        (1 / target.length) * ratioOfTotal * 100
      );
    } else {
      return this.monitorProgressIncrementor(target, ratioOfTotal * 100);
    }
  }

  public async calculate(
    calculateConfig: MugginsSolverCalculateConfig
  ): Promise<CalculateEquationResult[]> {
    this.currentStatus.current = 0;

    if (
      calculateConfig.faces.length < 2 ||
      calculateConfig.operations.length === 0 ||
      calculateConfig.maxTotal < calculateConfig.minTotal
    ) {
      return [];
    }

    this.incrementProgress(0);

    const fullStart = new Date().getTime();
    let start = new Date().getTime();

    // Run on the orchestration worker because everything is blocked anyway and doing so increases performance.
    const [facePairingPermutations, operationPermutations] =
      this.monitorProgress(
        commonWorkerFunctions.getFaceAndOperationPermutations(calculateConfig),
        0.05
      );
    this.debug(
      'permutations',
      new Date().getTime() - start,
      'ms',
      facePairingPermutations.length
    );

    start = new Date().getTime();
    const sortedResults = await Promise.all(
      this.monitorProgress(
        chunk(facePairingPermutations, 100).map(
          (arr) =>
            this.pooledCommonWorkerFunctions.calculateFromFaceAndOperationPermutations(
              calculateConfig,
              arr,
              operationPermutations
            ).data
        ),
        0.8
      )
    );
    this.debug(
      'initial results',
      new Date().getTime() - start,
      'ms',
      sortedResults.length
    );

    // Run on the orchestration worker because everything is blocked anyway and doing so increases performance.
    start = new Date().getTime();
    const finalResults = this.monitorProgress(
      commonWorkerFunctions.mergeCalculateResultsArrays(sortedResults),
      0.15
    );
    this.debug(
      'merged results',
      new Date().getTime() - start,
      'ms',
      finalResults.length
    );
    this.debug('full run', new Date().getTime() - fullStart, 'ms');

    // Bring the progress up to 100.
    this.incrementProgress(
      this.currentStatus.total - this.currentStatus.current
    );

    return finalResults;
  }

  public stop() {
    this.pooledExecutor.stopAll();
  }

  private static solver?: MugginsSolver;

  public static stop() {
    MugginsSolver.solver?.stop();
    MugginsSolver.solver?.status.unsubscribe();
  }

  public static async calculate(
    solverConfig: MugginsSolverConfig,
    calculateConfig: MugginsSolverCalculateConfig
  ): Promise<CalculateEquationResult[]> {
    if (!!MugginsSolver.solver) {
      throw new Error(
        'Processor is already running. Stop it before trying again.'
      );
    }

    const solver = new MugginsSolver(solverConfig);
    solver.status.subscribe(emitProgressStatusRoot);
    MugginsSolver.solver = new MugginsSolver(solverConfig);

    const result = await solver.calculate(calculateConfig);
    MugginsSolver.solver = undefined;
    return result;
  }
}

export const calculateWorkerFunctions = {
  calculate: MugginsSolver.calculate,
};

/**
 * Wraps MugginsSolver in a webworker. This ensures all the data serialize/deserialize and merging is done on a
 * separate worker. Thus keeping our UI responsive.
 */
export class MugginsSolverOrchestrator {
  private readonly pooledCalculateFunctions;

  public constructor(public readonly solverConfig: MugginsSolverConfig) {
    this.pooledCalculateFunctions = pooledFunctions(
      new PooledExecutor(getProcessorGenerator(solverConfig, false), 1),
      calculateWorkerFunctions
    );
  }

  public calculate(calculateConfig: MugginsSolverCalculateConfig) {
    return this.pooledCalculateFunctions.calculate(
      this.solverConfig,
      calculateConfig
    ) as any as PooledExecutor.WorkHandler<
      CalculateEquationResult[],
      ProgressStatus
    >;
  }
}
