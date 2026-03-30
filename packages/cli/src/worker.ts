import { parentPort } from 'node:worker_threads';
import { generateAndWriteTempFile } from './generate.js';
import type { WorkerTask, WorkerResult } from './generate.js';

parentPort!.on('message', async (task: WorkerTask) => {
  try {
    await generateAndWriteTempFile(task.faces, task.minTotal, task.maxTotal, task.tempPath, task.flushHighWater);
    parentPort!.postMessage({
      faces: task.faces,
      success: true,
    } satisfies WorkerResult);
  } catch (e) {
    parentPort!.postMessage({
      faces: task.faces,
      success: false,
      error: (e as Error).message,
    } satisfies WorkerResult);
  }
});
