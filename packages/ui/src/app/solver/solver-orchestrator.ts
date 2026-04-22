import { wrap, proxy, transfer, Remote } from 'comlink';
import { signal } from '@angular/core';
import {
  CalculateEquationResult,
  MugginsSolverCalculateConfig,
} from '@muggins_calculator/common';
import type {
  CoordinatorApi,
  CoordinatorProgress,
} from './solver-coordinator.worker.browser';
import { WORKER_COUNT } from './solver-constants';

export type CalculateProgress = CoordinatorProgress;

export interface SolverOrchestratorConfig {
  readonly calculateConfig: MugginsSolverCalculateConfig;
}

export enum CalculateStatus {
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  CANCELLED = 'cancelled',
}

export class SolverOrchestrator {
  public readonly progress = signal<CalculateProgress>({
    duration: 0,
    completedTasks: 0,
    remainingTasks: 0,
    totalTasks: 0,
    percentage: 0,
    estimatedTimeToCompletion: 0,
  });
  public readonly status = signal<CalculateStatus>(CalculateStatus.PROCESSED);
  public readonly results = signal<CalculateEquationResult[]>([]);

  private coordinatorApi!: Remote<CoordinatorApi>;
  private coordinatorWorker!: Worker;
  private computeWorkers!: Worker[];
  private cancelReject: (() => void) | null = null;

  constructor() {
    this.createWorkers();
  }

  private createWorkers(): void {
    // Create coordinator worker.
    this.coordinatorWorker = new Worker(
      new URL('./solver-coordinator.worker.browser', import.meta.url)
    );

    // Create compute workers.
    this.computeWorkers = Array.from(
      { length: WORKER_COUNT },
      () => new Worker(new URL('./solver.worker.browser', import.meta.url))
    );

    // Create MessageChannels and distribute ports.
    const coordinatorPorts: MessagePort[] = [];
    this.computeWorkers.forEach((computeWorker) => {
      const channel = new MessageChannel();
      coordinatorPorts.push(channel.port1);
      computeWorker.postMessage({ type: 'init-port' }, [channel.port2]);
    });

    // Wrap coordinator with comlink for RPC.
    this.coordinatorApi = wrap<CoordinatorApi>(this.coordinatorWorker);

    // Transfer ports to coordinator so it can talk directly to compute workers.
    this.coordinatorApi.initializePool(
      transfer(coordinatorPorts, coordinatorPorts)
    );
  }

  private terminateWorkers(): void {
    this.coordinatorWorker.terminate();
    this.computeWorkers.forEach((w) => w.terminate());
  }

  public isCancelled(): boolean {
    return this.status() === CalculateStatus.CANCELLED;
  }

  public cancel(): void {
    this.status.set(CalculateStatus.CANCELLED);
    // Reject the pending calculate promise so it resolves immediately.
    if (this.cancelReject) {
      this.cancelReject();
      this.cancelReject = null;
    }
    // Terminate all workers to immediately stop all processing.
    // Recreate fresh workers for the next calculation.
    this.terminateWorkers();
    this.createWorkers();
  }

  public async calculate(
    config: SolverOrchestratorConfig
  ): Promise<CalculateEquationResult[]> {
    this.status.set(CalculateStatus.PROCESSING);
    this.progress.set({
      duration: 0,
      completedTasks: 0,
      remainingTasks: 0,
      totalTasks: 0,
      percentage: 0,
      estimatedTimeToCompletion: 0,
    });

    const cancelPromise = new Promise<never>((_, reject) => {
      this.cancelReject = () => reject(new Error('cancelled'));
    });

    try {
      const results = await Promise.race([
        this.coordinatorApi.calculate(
          config,
          proxy((progressData: CalculateProgress) => {
            this.progress.set(progressData);
          })
        ),
        cancelPromise,
      ]);

      this.cancelReject = null;

      if (this.isCancelled()) {
        return [];
      }

      // Terminate and recreate workers to free memory between calculations.
      this.terminateWorkers();
      this.createWorkers();

      this.status.set(CalculateStatus.PROCESSED);
      this.results.set(results);
      return results;
    } catch (e) {
      if (!this.isCancelled()) {
        throw e;
      }
      return [];
    }
  }

  public destroy(): void {
    this.terminateWorkers();
  }
}
