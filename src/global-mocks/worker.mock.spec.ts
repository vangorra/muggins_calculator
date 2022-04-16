import { MockWorker, MockWorkerManager } from './worker.mock';

const enum RunTestType {
  OnMessage,
  OnError,
  OnMessageError,
}

describe(MockWorker.name, () => {
  test('default callbacks', () => {
    MockWorker.DEFAULT_CALLBACK();
    MockWorkerManager.DEFAULT_CREATE_LISTENER();
  });

  const testPostMessage = (runTestType: RunTestType) => {
    let desc = 'message return';
    switch (runTestType) {
      case RunTestType.OnError:
        desc = 'general error';
        break;
      case RunTestType.OnMessageError:
        desc = 'message error';
        break;
    }

    test(`postMessage and expect ${desc}`, () => {
      const runner = jest.fn();
      const createListener = jest.fn();
      const onmessage = jest.fn();
      const onerror = jest.fn();
      const onmessageerror = jest.fn();
      const worker = new MockWorker(
        {
          runner,
          createListener,
          url: 'TEST_URL',
        },
        { name: 'TEST NAME' }
      );
      worker.onmessage = onmessage;
      worker.onerror = onerror;
      worker.onmessageerror = onmessageerror;

      switch (runTestType) {
        case RunTestType.OnError:
          runner.mockImplementation(() => {
            throw new Error('GENERAL TEST ERROR');
          });
          break;
        case RunTestType.OnMessageError:
          runner.mockImplementation(() => {
            throw new Error('MessageError: TEST ERROR');
          });
          break;
        default:
          runner.mockReturnValue('TEST DATA');
      }

      worker.postMessage('TEST MESSAGE');

      expect(createListener).not.toHaveBeenCalled();
      expect(runner).toHaveBeenCalledWith('TEST MESSAGE');

      switch (runTestType) {
        case RunTestType.OnError:
          expect(onmessage).not.toHaveBeenCalled();
          expect(onerror).toHaveBeenCalledWith(
            new ErrorEvent('Error: GENERAL TEST ERROR')
          );
          expect(onmessageerror).not.toHaveBeenCalled();
          break;
        case RunTestType.OnMessageError:
          expect(onmessage).not.toHaveBeenCalled();
          expect(onerror).not.toHaveBeenCalled();
          expect(onmessageerror).toHaveBeenCalledWith(
            new MessageEvent<any>('MessageError: TEST ERROR')
          );
          break;
        default:
          expect(onmessage).toHaveBeenCalledWith('TEST DATA');
          expect(onerror).not.toHaveBeenCalled();
          expect(onmessageerror).not.toHaveBeenCalled();
          break;
      }
    });
  };

  testPostMessage(RunTestType.OnMessage);
  testPostMessage(RunTestType.OnError);
  testPostMessage(RunTestType.OnMessageError);
});

describe(MockWorkerManager.name, () => {
  test('add, get remove worker config', () => {
    const runner = jest.fn();
    const mockWorkerManager = new MockWorkerManager();
    mockWorkerManager.add('test', runner);

    expect(mockWorkerManager.get('test')).toEqual({
      url: 'test',
      runner,
      createListener: MockWorkerManager.DEFAULT_CREATE_LISTENER,
    });

    mockWorkerManager.remove('test');
    expect(mockWorkerManager.get('test')).toBeFalsy();
  });

  test('create without config', () => {
    const mockWorkerManager = new MockWorkerManager();
    expect(() => mockWorkerManager.create('test')).toThrow(
      new Error(
        "Worker runner for url 'test' is not configured. Configure it with 'window.mockWorkerManager.add(url, runner)' typically in setup-jest.ts."
      )
    );
  });

  test('create with config', () => {
    const runner = jest.fn();
    const mockWorkerManager = new MockWorkerManager();
    mockWorkerManager.add('test', runner);
    expect(mockWorkerManager.get('test').createListener).toBe(
      MockWorkerManager.DEFAULT_CREATE_LISTENER
    );

    const mockWorker = mockWorkerManager.create('test');
    expect(mockWorker.config).toEqual(mockWorkerManager.get('test'));
  });

  test('create with config and listener', () => {
    const runner = jest.fn();
    const createListener = jest.fn();
    const mockWorkerManager = new MockWorkerManager();
    mockWorkerManager.add('test', runner);

    mockWorkerManager.setCreateListener('test', createListener);
    expect(mockWorkerManager.get('test').createListener).toBe(createListener);

    const mockWorker = mockWorkerManager.create('test');
    expect(mockWorker.config).toEqual(mockWorkerManager.get('test'));
    expect(createListener).toHaveBeenCalled();

    mockWorkerManager.removeCreateListener('test');
    expect(mockWorkerManager.get('test').createListener).toBe(
      MockWorkerManager.DEFAULT_CREATE_LISTENER
    );
    expect(mockWorker.config.createListener).toBe(
      MockWorkerManager.DEFAULT_CREATE_LISTENER
    );
  });

  test('window.Worker creates worker', () => {
    window.mockWorkerManager.add('test', jest.fn());
    const worker = new window.Worker('test') as any as MockWorker;
    expect(worker.config).toEqual(window.mockWorkerManager.get('test'));
  });
});
