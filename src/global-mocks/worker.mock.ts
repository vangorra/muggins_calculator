/*
A passable mock of Worker. It avoids the use of ES6 modules by requiring one to configure URL mapping
in the manager during jest setup. This ensures the code is still ran as close to reality as possible.
 */

const windowAddEventListenerOriginal = window.addEventListener;

type ListenerType<T> =
  | {
      (this: Worker, evt: T): any;
    }
  | {
      handleEvent(this: Worker, object: T): any;
    };

export class MockWorker implements Worker {
  public onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null;

  public onerror: ((this: AbstractWorker, ev: ErrorEvent) => any) | null = null;

  public onmessageerror: ((this: Worker, ev: MessageEvent) => any) | null =
    null;

  public readonly id = MockWorker.newWorkerId();

  private workerMessageListener!: EventListener;

  private readonly messageListeners: ListenerType<MessageEvent>[] = [];

  private readonly errorListeners: ListenerType<ErrorEvent>[] = [];

  private readonly messageErrorListeners: ListenerType<MessageEvent>[] = [];

  constructor(
    private readonly scriptURL: string | URL,
    public readonly options?: WorkerOptions
  ) {
    // Intercept and store the worker's message listener.
    // Isolating the modules allows us to require the same script multiple times
    jest.isolateModules(() => {
      const scriptPath = scriptURL.toString();
      const mock = jest
        .spyOn(window, 'addEventListener')
        .mockImplementation(
          (
            event: string,
            callback: EventListenerOrEventListenerObject,
            listenerOptions?: boolean | AddEventListenerOptions | undefined
          ) => {
            if (event === 'message') {
              this.workerMessageListener = callback as EventListener;
            } else {
              windowAddEventListenerOriginal(event, callback, listenerOptions);
            }
          }
        );
      require(scriptPath);
      mock.mockClear();
    });
  }

  terminate(): void {
    // console.warn('Terminate is not supported for MockWorker.');
    MockWorker.delete(this.id);
  }

  addEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(type: any, listener: any): void {
    this.getListeners(type).push(listener);
  }

  removeEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(type: any, listener: any): void {
    const listeners = this.getListeners(type);
    const index = listeners.findIndex(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  dispatchEvent(event: Event): boolean {
    const singleListener =
      this.getSingleListener(event.type) || ((() => undefined) as any);

    singleListener.call(this, event);

    this.getListeners(event.type).forEach((listener: any) => {
      if ('handleEvent' in listener) {
        listener.handleEvent.call(this, event);
      } else {
        listener.call(this, event);
      }
    });

    return true;
  }

  private getSingleListener(type: string) {
    switch (type) {
      case 'message':
        return this.onmessage;
      case 'error':
        return this.onerror;
      case 'messageerror':
        return this.onmessageerror;
      default:
        console.warn('Unknown event type', type);
        return null;
    }
  }

  private getListeners(type: string) {
    switch (type) {
      case 'message':
        return this.messageListeners;
      case 'error':
        return this.errorListeners;
      case 'messageerror':
        return this.messageErrorListeners;
      default:
        return [];
    }
  }

  public postMessage(message: any): void {
    const zone = Zone.current.fork({
      name: this.id,
    });
    zone.run(async () => {
      try {
        await this.workerMessageListener({
          data: message,
        } as any);
      } catch (e) {
        this.dispatchEvent(
          new ErrorEvent('error', {
            error: e,
          })
        );
      }
    });
  }

  private static workerIdIndex = -1;

  private static readonly workerMap: { [id: string]: MockWorker } = {};

  private static newWorkerId() {
    MockWorker.workerIdIndex += 1;
    return `mock_worker_${MockWorker.workerIdIndex}`;
  }

  public static clear() {
    Object.keys(MockWorker.workerMap).forEach((id) => {
      MockWorker.delete(id);
    });
  }

  public static delete(id: string) {
    delete MockWorker.workerMap[id];
  }

  public static new(
    scriptURL: string | URL,
    options?: WorkerOptions
  ): MockWorker {
    const worker = new MockWorker(scriptURL, options);
    MockWorker.workerMap[worker.id] = worker;
    return worker;
  }

  public static get(id: string) {
    return MockWorker.workerMap[id];
  }

  public static getFromZone(zone: Zone): MockWorker | undefined {
    let currentZone: Zone | null = zone;
    while (currentZone !== null) {
      const worker = MockWorker.get(currentZone.name);
      if (!!worker) {
        return worker;
      }

      currentZone = currentZone.parent;
    }

    return undefined;
  }
}

const originalPostMessage = window.postMessage;
Object.defineProperty(window, 'postMessage', {
  value: (data: any) => {
    const worker = MockWorker.getFromZone(Zone.current);
    if (!worker) {
      originalPostMessage(data);
      return;
    }

    // Workers wrap the return. So we need to simulate that here.
    worker.dispatchEvent(new MessageEvent<any>('message', { data }));
  },
});

Object.defineProperty(window, 'Worker', {
  value: function (scriptURL: string | URL, options?: WorkerOptions) {
    return MockWorker.new(scriptURL, options);
  },
});
