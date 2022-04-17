import * as solverUtils from './solver/utils';
import { TestBed } from '@angular/core/testing';

import { SolverWorkerService } from './solver-worker.service';
import { OperationEnum } from './solver/solver';
import { take } from 'rxjs';
import { SOLVER_WORKER_URL } from './__mocks__/solver-worker.url';

describe(SolverWorkerService.name, () => {
  let service: SolverWorkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SolverWorkerService);
  });

  const testPostMessage = (preferWorker: boolean) => {
    test(`Post message ${preferWorker ? 'with' : 'without'} worker`, (done) => {
      service
        .postMessage(
          {
            operations: [OperationEnum.PLUS],
            faces: [2, 2, 2],
            minTotal: 1,
            maxTotal: 10,
          },
          preferWorker
        )
        .pipe(take(1))
        .subscribe((response) => {
          expect(response).toEqual({
            data: [
              {
                total: '6',
                results: [
                  {
                    total: 6,
                    fullEquation: '6 = 2 + (2 + 2)',
                    equation: '2 + (2 + 2)',
                    sortableEquation: '6 Z 2 + X2 + 2Y',
                  },
                ],
              },
            ],
          });
          done();
        });
    });
  };

  testPostMessage(true);
  testPostMessage(false);

  test('worker fails with onerror', (done) => {
    window.mockWorkerManager.setCreateListener(SOLVER_WORKER_URL, (worker) => {
      jest.spyOn(worker, 'postMessage').mockImplementation(() => {
        worker.onerror(new ErrorEvent('Test error'));
      });
    });

    new SolverWorkerService().postMessage({} as any).subscribe({
      next: () => {
        expect(false).toBeTruthy();
        done();
      },
      error: (err) => {
        expect(err).toBeTruthy();
        done();
      },
    });
  });

  test('worker fails with onmessageerror', (done) => {
    window.mockWorkerManager.setCreateListener(SOLVER_WORKER_URL, (worker) => {
      jest.spyOn(worker, 'postMessage').mockImplementation(() => {
        worker.onmessageerror(new MessageEvent<any>('Test error'));
      });
    });

    new SolverWorkerService().postMessage({} as any).subscribe({
      next: () => {
        expect(false).toBeTruthy();
        done();
      },
      error: (err) => {
        expect(err).toBeTruthy();
        done();
      },
    });
  });

  test('local worker fails with onerror', (done) => {
    jest.spyOn(solverUtils, 'runSolverWorkerMain').mockImplementation(() => {
      throw new Error('Test failure');
    });

    new SolverWorkerService().postMessage({} as any, false).subscribe({
      next: () => {
        expect(false).toBeTruthy();
        done();
      },
      error: (err) => {
        expect(err).toBeTruthy();
        done();
      },
    });
  });
});
