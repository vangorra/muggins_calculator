import 'jest-preset-angular/setup-jest'; // eslint-disable-line import/no-extraneous-dependencies
import './global-mocks/match-media.mock';
import './global-mocks/computed-style.mock';
import './global-mocks/worker.mock';
import { SOLVER_WORKER_URL } from './app/__mocks__/solver-worker.url';
import { runSolverWorkerMain } from './app/solver/utils';

// Globally mock worker URLs.
jest.mock('./app/solver-worker.url');

// Configure workers to run methods instead of loading code remotely.
window.mockWorkerManager.add(SOLVER_WORKER_URL, (message: any) => ({
  data: runSolverWorkerMain(message),
}));
