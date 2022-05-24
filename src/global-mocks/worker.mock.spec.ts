import { MockWorker } from './worker.mock';

describe(MockWorker.name, () => {
  let worker: Worker;

  beforeEach(() => {
    worker = new Worker('./test-worker.ts');
  });

  afterEach(() => {
    MockWorker.clear();
  });

  test('Has error.', async () => {
    let error: any;
    let result: any = undefined;
    try {
      result = await new Promise<any>((res, rej) => {
        worker.onmessage = res;
        worker.onerror = rej;
        worker.onmessageerror = rej;

        worker.postMessage({
          throwError: true,
        });
      });
    } catch (e) {
      error = e;
    }

    expect(result).toBeUndefined();
    expect(error.error.message).toEqual('Test error');
  });

  test('Sub workers', async () => {
    const result = await new Promise<any>((res, rej) => {
      worker.onmessage = res;
      worker.onerror = rej;
      worker.onmessageerror = rej;

      worker.postMessage({
        depth: 0,
        index: 0,
        spawnCount: 4,
      });
    });

    expect(result.data).toEqual(
      JSON.parse(`
      {
        "depth": 0,
        "index": 0,
        "spawnCount": 4,
        "results": [
          {
            "depth": 1,
            "index": 0,
            "spawnCount": 1,
            "results": [
              {
                "depth": 2,
                "index": 0,
                "spawnCount": 2,
                "results": [
                  {
                    "depth": 3,
                    "index": 0,
                    "spawnCount": 0,
                    "results": []
                  },
                  {
                    "depth": 3,
                    "index": 1,
                    "spawnCount": 0,
                    "results": []
                  }
                ]
              }
            ]
          },
          {
            "depth": 1,
            "index": 1,
            "spawnCount": 1,
            "results": [
              {
                "depth": 2,
                "index": 0,
                "spawnCount": 2,
                "results": [
                  {
                    "depth": 3,
                    "index": 0,
                    "spawnCount": 0,
                    "results": []
                  },
                  {
                    "depth": 3,
                    "index": 1,
                    "spawnCount": 0,
                    "results": []
                  }
                ]
              }
            ]
          },
          {
            "depth": 1,
            "index": 2,
            "spawnCount": 1,
            "results": [
              {
                "depth": 2,
                "index": 0,
                "spawnCount": 2,
                "results": [
                  {
                    "depth": 3,
                    "index": 0,
                    "spawnCount": 0,
                    "results": []
                  },
                  {
                    "depth": 3,
                    "index": 1,
                    "spawnCount": 0,
                    "results": []
                  }
                ]
              }
            ]
          },
          {
            "depth": 1,
            "index": 3,
            "spawnCount": 1,
            "results": [
              {
                "depth": 2,
                "index": 0,
                "spawnCount": 2,
                "results": [
                  {
                    "depth": 3,
                    "index": 0,
                    "spawnCount": 0,
                    "results": []
                  },
                  {
                    "depth": 3,
                    "index": 1,
                    "spawnCount": 0,
                    "results": []
                  }
                ]
              }
            ]
          }
        ]
      }
    `)
    );
  });
});
