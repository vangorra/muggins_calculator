/// <reference lib="webworker" />

import { runSolverWorkerMain } from './solver/utils';

// Default type of `self` is `WorkerGlobalScope & typeof globalThis`
// https://github.com/microsoft/TypeScript/issues/14877
declare let self: ServiceWorkerGlobalScope;

self.addEventListener('message', ({ data }) => {
  runSolverWorkerMain(data, (resultData) => postMessage(resultData));
});
