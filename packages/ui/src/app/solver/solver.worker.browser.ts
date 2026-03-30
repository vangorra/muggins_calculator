import { expose } from 'comlink';
import { commonWorkerFunctions } from '@muggins_calculator/common';
import { solutionsWorkerFunctions } from './solutions-worker-impl';

const workerApi = {
  ...commonWorkerFunctions,
  ...solutionsWorkerFunctions,
};

// Listen for a MessagePort transferred from the main thread.
// When received, expose only computation functions on that port for coordinator communication.
self.addEventListener('message', (event: MessageEvent) => {
  if (event.data?.type === 'init-port' && event.ports.length > 0) {
    const port = event.ports[0];
    port.start();
    expose({ ...commonWorkerFunctions }, port);
  }
});

// Also expose full API on self for direct comlink usage (used by SolutionsService).
expose(workerApi);
