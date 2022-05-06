import { Injectable } from '@angular/core';
import { bindNodeCallback, Observable } from 'rxjs';
import {
  runSolverWorkerMain,
  SolverWorkerMessage,
  SolverWorkerResponse,
} from './solver/utils';
import { solverWorkerFactory } from './solver-worker.url';

type RunSolverWorkerDoneType = (
  err: any,
  response: SolverWorkerResponse
) => void;

@Injectable({
  providedIn: 'root',
})
export class SolverWorkerService {
  public useWasm = false;

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
    (message as any).useWasm = this.useWasm;

    let runnerFn: (done: RunSolverWorkerDoneType) => void;

    if (Worker && preferWorker) {
      // Run process in a worker.
      runnerFn = (done: RunSolverWorkerDoneType) => {
        const worker = solverWorkerFactory();
        worker.onmessage = ({ data }) => done(undefined, data);
        worker.onerror = (e) => done(e, undefined as any);
        worker.onmessageerror = (e) => done(e, undefined as any);
        worker.postMessage(message);
      };
    } else {
      // Run process in current thread.
      runnerFn = (done: RunSolverWorkerDoneType) => {
        try {
          runSolverWorkerMain(message, (data) => done(undefined, data))
        } catch (e) {
          done(e, undefined as any);
        }
      };
    }

    return bindNodeCallback(runnerFn)();
  }
}
