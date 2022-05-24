import { range } from 'lodash';

self.addEventListener('message', async ({ data }) => {
  const { depth, index, spawnCount, throwError } = data;

  if (throwError) {
    throw new Error('Test error');
  }

  const results = await Promise.all(
    range(spawnCount).map(
      (spawnIndex) =>
        new Promise((res, rej) => {
          const worker = new Worker('./test-worker.ts');
          worker.onmessage = (message) => res(message.data);
          worker.onerror = rej;
          worker.onmessageerror = rej;

          worker.postMessage({
            depth: depth + 1,
            index: spawnIndex,
            spawnCount: depth + 1 < 3 ? depth + 1 : 0,
          });
        })
    )
  );

  postMessage({
    depth,
    index,
    spawnCount,
    results,
  });
});
