import { Injectable, InjectionToken, inject } from '@angular/core';
import { wrap, proxy } from 'comlink';
import { CalculateEquationResult, OperationEnum, DB_VERSION } from '@muggins_calculator/common';
import type { SolutionsWorkerApi } from './solver/solutions-worker-impl';

const DB_REFRESH_KEY = 'solutions_db_refresh';

export const SOLUTIONS_WORKER_API = new InjectionToken<SolutionsWorkerApi>(
  'SolutionsWorkerApi',
  {
    providedIn: 'root',
    factory: () => {
      const worker = new Worker(
        new URL('./solver/solver.worker.browser', import.meta.url),
      );
      return wrap<SolutionsWorkerApi>(worker) as unknown as SolutionsWorkerApi;
    },
  },
);

@Injectable({
  providedIn: 'root',
})
export class SolutionsService {
  private api = inject(SOLUTIONS_WORKER_API);
  private readerPromises = new Map<number, Promise<boolean>>();

  private ensureReader(diceCount: number): Promise<boolean> {
    let promise = this.readerPromises.get(diceCount);
    if (!promise) {
      promise = this.initAndCheckVersion(diceCount);
      this.readerPromises.set(diceCount, promise);
    }
    return promise;
  }

  private async initAndCheckVersion(diceCount: number): Promise<boolean> {
    try {
      const dbVersion = await this.api.initSolutionsReader(diceCount);

      if (dbVersion === DB_VERSION) {
        localStorage.removeItem(DB_REFRESH_KEY);
        return true;
      }

      console.error(
        `DB version mismatch: file has version ${dbVersion}, app expects version ${DB_VERSION}`,
      );

      if (localStorage.getItem(DB_REFRESH_KEY)) {
        localStorage.removeItem(DB_REFRESH_KEY);
        console.error('DB version still incompatible after refresh. Disabling precomputed solutions.');
        return false;
      }

      localStorage.setItem(DB_REFRESH_KEY, '1');
      window.location.reload();
      return false;
    } catch (e) {
      console.error('Mugbin init failed:', e);
      return false;
    }
  }

  async getJumpData(
    diceCount: number,
    faces: number[],
    operations: OperationEnum[],
    onProgress: (completed: number, total: number) => void,
  ): Promise<Map<number, number> | null> {
    const ready = await this.ensureReader(diceCount);
    if (!ready) return null;

    return this.api.getJumpData(diceCount, faces, operations, proxy(onProgress));
  }

  async getEquationsForTotal(
    diceCount: number,
    faces: number[],
    total: number,
    operations: OperationEnum[],
  ): Promise<CalculateEquationResult[] | null> {
    const ready = await this.ensureReader(diceCount);
    if (!ready) return null;

    return this.api.getEquationsForTotal(diceCount, faces, total, operations);
  }
}
