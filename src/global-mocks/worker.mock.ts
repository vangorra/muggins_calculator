/*
A passable mock of Worker. It avoids the use of ES6 modules by requiring one to configure URL mapping
in the manager during jest setup. This ensures the code is still ran as close to reality as possible.
 */

interface WorkerRunner {
  (message: any): any;
}

interface CreateListener {
  (worker: MockWorker): void;
}

interface WorkerConfig {
  url: string;
  runner: WorkerRunner;
  createListener: CreateListener;
}

export class MockWorker {
  static readonly DEFAULT_CALLBACK = () => undefined;

  public onmessage: (response: any) => undefined = MockWorker.DEFAULT_CALLBACK;

  public onerror: (errorEvent: ErrorEvent) => undefined =
    MockWorker.DEFAULT_CALLBACK;

  public onmessageerror: (messageEvent: MessageEvent) => undefined =
    MockWorker.DEFAULT_CALLBACK;

  constructor(
    public readonly config: WorkerConfig,
    public readonly options?: WorkerOptions
  ) {}

  public postMessage(message: any): void {
    try {
      this.onmessage(this.config.runner(message));
    } catch (error) {
      const errorMessage = error + '';
      if (errorMessage.indexOf('MessageError:') > -1) {
        this.onmessageerror(new MessageEvent<any>(errorMessage));
      } else {
        this.onerror(new ErrorEvent(errorMessage));
      }
    }
  }
}

export class MockWorkerManager {
  static readonly DEFAULT_CREATE_LISTENER = () => undefined;

  private readonly workerConfig: { [url: string]: WorkerConfig } = {};

  public add(url: string, runner: WorkerRunner): void {
    this.workerConfig[url] = {
      url,
      runner,
      createListener: MockWorkerManager.DEFAULT_CREATE_LISTENER,
    };
  }

  public get(url: string): WorkerConfig {
    return this.workerConfig[url];
  }

  public remove(url: string): void {
    delete this.workerConfig[url];
  }

  create(scriptURL: string | URL, options?: WorkerOptions): MockWorker {
    const urlStr = scriptURL.toString();
    const config = this.get(scriptURL.toString());
    if (!config) {
      throw new Error(
        `Worker runner for url '${urlStr}' is not configured. Configure it with 'window.mockWorkerManager.add(url, runner)' typically in setup-jest.ts.`
      );
    }

    const mockWorker = new MockWorker(config, options);
    config.createListener(mockWorker);
    return mockWorker;
  }

  public setCreateListener(url: string, listener: CreateListener): void {
    this.workerConfig[url].createListener = listener;
  }

  public removeCreateListener(url: string): void {
    this.workerConfig[url].createListener =
      MockWorkerManager.DEFAULT_CREATE_LISTENER;
  }
}

declare global {
  interface Window {
    mockWorkerManager: MockWorkerManager;
  }
}

const mockWorkerManager = new MockWorkerManager();

Object.defineProperty(window, 'mockWorkerManager', {
  value: mockWorkerManager,
  writable: false,
  configurable: false,
});

Object.defineProperty(window, 'Worker', {
  value: function (scriptURL: string | URL, options?: WorkerOptions) {
    return mockWorkerManager.create(scriptURL, options);
  },
});
