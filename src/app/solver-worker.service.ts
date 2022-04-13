import { Injectable } from '@angular/core';
import { bindNodeCallback, Observable } from 'rxjs';
import {
  runSolverWorkerMain,
  SolverWorkerMessage,
  SolverWorkerResponse,
} from './solver/utils';

type RunSolverWorkerDoneType = (
  err: any,
  response: SolverWorkerResponse
) => void;

@Injectable({
  providedIn: 'root',
})
export class SolverWorkerService {
  /**
   * Run a message through a worker. This method will begin work once the returned
   * observable is subscribed.
   * @param message
   * @param preferWorker
   */
  public postMessage(
    message: SolverWorkerMessage,
    preferWorker = true
  ): Observable<SolverWorkerResponse> {
    let runnerFn: (done: RunSolverWorkerDoneType) => void;

    if (Worker && preferWorker) {
      // Run process in a worker.
      runnerFn = (done: RunSolverWorkerDoneType) => {
        const worker = new Worker(new URL('./solver.worker', import.meta.url));
        worker.onmessage = ({ data }) => done(undefined, data);
        worker.onerror = (e) => done(e, undefined as any);
        worker.onmessageerror = (e) => done(e, undefined as any);
        worker.postMessage(message);
      };
    } else {
      // Run process in current thread.
      runnerFn = (done: RunSolverWorkerDoneType) => {
        try {
          done(undefined, runSolverWorkerMain(message));
        } catch (e) {
          done(e, undefined as any);
        }
      };
    }

    return bindNodeCallback(runnerFn)();
  }
}
