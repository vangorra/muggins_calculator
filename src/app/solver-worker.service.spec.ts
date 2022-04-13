import { TestBed } from '@angular/core/testing';

import { SolverWorkerService } from './solver-worker.service';
import { OperationEnum } from './solver/solver';
import { take } from 'rxjs';

class MockWorker {
  public onmessage: (response: any) => undefined = () => undefined;

  public onerror: (errorEvent: ErrorEvent) => undefined = () => undefined;

  public onmessageerror: (messageEvent: MessageEvent) => undefined = () =>
    undefined;

  public postedMessage: any;

  public postMessage(message: any) {
    this.postedMessage = message;
  }
}

describe('SolverWorkerService', () => {
  let service: SolverWorkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SolverWorkerService);
  });

  const runIt = (preferWorker: boolean, done: () => void) => {
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
  };

  it(SolverWorkerService.prototype.postMessage + ' with Worker', (done) => {
    runIt(true, done);
  });

  it(SolverWorkerService.prototype.postMessage + ' without Worker', (done) => {
    runIt(false, done);
  });

  it('worker fails with onerror', (done) => {
    const mockWorker = new MockWorker();
    spyOn(mockWorker, 'postMessage').and.callFake(() => {
      mockWorker.onerror(new ErrorEvent('Test error'));
    });
    spyOn(window, 'Worker').and.returnValue(mockWorker as any);

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

  it('worker fails with onmessageerror', (done) => {
    const mockWorker = new MockWorker();
    spyOn(mockWorker, 'postMessage').and.callFake(() => {
      mockWorker.onmessageerror(new MessageEvent<any>('Test error'));
    });
    spyOn(window, 'Worker').and.returnValue(mockWorker as any);

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
});
