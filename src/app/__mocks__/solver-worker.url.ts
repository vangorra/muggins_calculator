/*
Mock the URL for the solver worker.
The solver worker uses ES6 module import metadata to resolve the script. Jest doesn't support that very well,
so we mock the URL globally in setup-jest.ts using jest.mock().
 */
export const SOLVER_WORKER_URL = './solver.worker';

export const solverWorkerFactory = () => new Worker(SOLVER_WORKER_URL);
