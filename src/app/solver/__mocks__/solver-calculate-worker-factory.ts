/*
Mock the URL for the solver worker.
The solver worker uses ES6 module import metadata to resolve the script. Jest doesn't support that very well,
so we mock the URL globally in setup-jest.ts using jest.mock().
 */
import path from 'path';

export const SOLVER_CALCULATE_WORKER_URL = path.resolve(
  __dirname,
  '../solver-calculate.worker'
);

export const solverCalculateWorkerFactory = () =>
  new Worker(SOLVER_CALCULATE_WORKER_URL);
