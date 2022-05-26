/*
A suite of utilities to make working with web workers easier.
 */

import { range } from 'lodash';
import { Subject } from 'rxjs';

type JustMethodKeys<T> = {
  [P in keyof T]: T[P] extends Function ? P : never;
}[keyof T];
type ArgumentTypes<T> = T extends (...args: infer U) => any ? U : never;

interface ObjectFunctionCallMessage {
  data: RunMessage;
}

const MESSAGE_TYPE_PROPERTY = '__type__';
enum MessageTypeEnum {
  STATUS = 'status',
  RESULT = 'result',
  RUN = 'run',
}

export interface StatusMessage {
  [MESSAGE_TYPE_PROPERTY]: MessageTypeEnum.STATUS;
  data: any;
}

const PROP_FUNCTION_NAME = 'functionName';
const PROP_FUNCTION_ARGS = 'args';
interface RunMessage {
  [MESSAGE_TYPE_PROPERTY]: MessageTypeEnum.RUN;
  [PROP_FUNCTION_NAME]: string;
  [PROP_FUNCTION_ARGS]: any[];
}

interface GenericObject {
  [key: string | symbol]: (...any: any[]) => any | never;
}

export function postGenericMessage<T>(data: T, type: MessageTypeEnum): void {
  postMessage({
    data,
    [MESSAGE_TYPE_PROPERTY]: type,
  });
}

export function postStatusMessage<T>(data: T): void {
  postGenericMessage(data, MessageTypeEnum.STATUS);
}

export function postResultMessage<T>(data: T): void {
  postGenericMessage(data, MessageTypeEnum.RESULT);
}

export function postErrorMessage<T>(data: T): void {
  postGenericMessage(data, MessageTypeEnum.RESULT);
}

function newRunMessage(functionName: string, args: any[]): RunMessage {
  return {
    [MESSAGE_TYPE_PROPERTY]: MessageTypeEnum.RUN,
    functionName,
    args,
  };
}

function isGenericMessage(obj: any, type: MessageTypeEnum): boolean {
  return MESSAGE_TYPE_PROPERTY in obj && obj[MESSAGE_TYPE_PROPERTY] === type;
}

export function isStatusMessage(obj: any): boolean {
  return isGenericMessage(obj, MessageTypeEnum.STATUS);
}

export function isResultMessage(obj: any): boolean {
  return isGenericMessage(obj, MessageTypeEnum.RESULT);
}

function isRunMessage(obj: any, exposeObject: GenericObject): boolean {
  return (
    isGenericMessage(obj, MessageTypeEnum.RUN) &&
    PROP_FUNCTION_NAME in obj &&
    PROP_FUNCTION_ARGS in obj &&
    typeof obj.functionName === 'string' &&
    Array.isArray(obj.args) &&
    obj.functionName in exposeObject &&
    typeof exposeObject[obj.functionName] === 'function'
  );
}

const PROGRESS_ROOT_EVENT = 'root';
export const PROGRESS_STATUS_EVENT = 'progress_status';
export interface ProgressStatusEventData {
  readonly detail: {
    readonly id: string;
    readonly data: ProgressStatus;
  };
}

export function emitProgressStatus(id: string, progressStatus: ProgressStatus) {
  self.dispatchEvent(
    new CustomEvent<ProgressStatusEventData>(PROGRESS_STATUS_EVENT, {
      detail: {
        id,
        data: progressStatus,
      },
    } as any)
  );
}

export function emitProgressStatusRoot(progressStatus: ProgressStatus) {
  return emitProgressStatus(PROGRESS_ROOT_EVENT, progressStatus);
}

export function expose(exposeObject: GenericObject): void {
  self.addEventListener(PROGRESS_STATUS_EVENT, (event: Event) => {
    const eventData = event as any as ProgressStatusEventData;
    if (eventData.detail.id === PROGRESS_ROOT_EVENT) {
      postStatusMessage(eventData.detail);
    }
  });

  self.addEventListener(
    'message',
    async (message: ObjectFunctionCallMessage) => {
      const { data } = message;
      if (isRunMessage(data, exposeObject)) {
        const result = await exposeObject[data.functionName](...data.args);
        postResultMessage(result);
      } else {
        const exposeObjectStructure = Object.fromEntries(
          Object.entries(exposeObject).map(([key, value]) => [
            key,
            typeof value,
          ])
        );
        throw new Error(
          `Invalid ${MessageTypeEnum.RUN} message ${JSON.stringify(
            data,
            null,
            2
          )}. Expose object structure: ${JSON.stringify(
            exposeObjectStructure,
            null,
            2
          )}`
        );
      }
    }
  );
}

export interface ProgressStatus {
  current: number;
  buffer: number;
  total: number;
}

/**
 * Pooled executor for managing work across multiple processors.
 */
export class PooledExecutor {
  private idleProcessors: PooledExecutor.Processor[] = [];

  private pendingWorkQueue: PooledExecutor.QueuedWork<any, any>[] = [];

  private runningWorkQueue: PooledExecutor.QueuedWorkInProgress<any, any>[] =
    [];

  private isStartWorkQueued = false;

  public constructor(
    private readonly processorGenerator: () => PooledExecutor.Processor,
    processorCount: number,
    private readonly isDebugging = false
  ) {
    range(processorCount).forEach(() =>
      this.idleProcessors.push(processorGenerator())
    );
  }

  private hasWork() {
    return this.pendingWorkQueue.length > 0;
  }

  private hasIdleProcessors() {
    return this.idleProcessors.length > 0;
  }

  private queueStartWork() {
    if (this.isStartWorkQueued) {
      return;
    }

    setTimeout(() => this.startWork(), 0);
    this.isStartWorkQueued = true;
  }

  private startWork() {
    this.debug(
      'startWork',
      this.pendingWorkQueue.length,
      this.idleProcessors.length
    );

    this.isStartWorkQueued = false;
    range(
      Math.min(this.pendingWorkQueue.length, this.idleProcessors.length)
    ).forEach(() => {
      if (!this.hasWork()) {
        return;
      }

      if (!this.hasIdleProcessors()) {
        return;
      }

      const queuedWork = this.dequeueFirst()!;
      const processor = this.idleProcessors.pop()!;

      this.onWorkStarted(queuedWork, processor);

      // Execute the work.
      this.debug('Starting work', queuedWork.id, queuedWork.work.functionName);
      processor
        .execute(queuedWork.work, queuedWork.onStatus)
        .then((data) => {
          this.debug(
            'Work result',
            queuedWork.id,
            queuedWork.work.functionName
          );
          return queuedWork.onData(data);
        })
        .catch((error) => {
          this.debug('Work error:', error, queuedWork.work.functionName);
          queuedWork.onError(error);
        })
        // Restore the processor.
        .finally(() => {
          this.debug(
            'Work finished',
            queuedWork.id,
            queuedWork.work.functionName
          );
          this.stop(queuedWork.id);
          // Try to do more work.
          this.queueStartWork();
        });
    });
  }

  private debug(...arr: any[]) {
    if (this.isDebugging) {
      console.debug(...arr);
    }
  }

  private onWorkStarted(
    queuedWork: PooledExecutor.QueuedWork<any, any>,
    processor: PooledExecutor.Processor
  ) {
    this.debug('onWorkStarted', queuedWork.id, queuedWork.work.functionName);
    this.runningWorkQueue.push({
      queuedWork,
      processor,
    });
  }

  /**
   * Stop work. If it is pending, then it will be removed from the queue. If it is processing, it will be removed and
   * the current process will be stopped.
   * @param id
   * @param beforeProcessorRecycle Execute this before recycling the processing back into the idle processor queue.
   * @private
   */
  public stop(
    id: string,
    beforeProcessorRecycle: PooledExecutor.QueuedWorkInProgressCallback = () =>
      undefined
  ) {
    this.debug('stop', id);
    this.dequeue(id);

    const workInProgress = this.dequeueWorkInProgress(id);
    if (workInProgress) {
      this.debug('Stopping processor');
      workInProgress.processor.stop();
      beforeProcessorRecycle(workInProgress);
      this.debug('Recycling processor');
      this.idleProcessors.push(workInProgress.processor);
    }
  }

  public enqueue<Return, Status>(
    work: PooledExecutor.Work<Return>
  ): PooledExecutor.WorkHandler<Return, Status> {
    const status = new Subject<Status>();
    const id = `${
      this.pendingWorkQueue.length
    }_${new Date().getTime()}_${Math.floor(Math.random() * 10000)}`;
    const stop = () => {
      this.debug('workHandler stop', id);
      this.stop(id);
    };

    this.debug('enqueue', id, work.functionName);

    const data = new Promise<Return>((onData, onError) => {
      this.pendingWorkQueue.push({
        id,
        work,
        stop,
        onData,
        onError,
        onStatus: (message) => status.next(message),
      });
      this.debug(
        'pendingWork push',
        id,
        work.functionName,
        this.pendingWorkQueue.length
      );
    });

    this.queueStartWork();

    return {
      id,
      data,
      status,
      stop,
    };
  }

  public dequeueFirst() {
    this.debug('dequeueFirst');
    const firstItem = this.pendingWorkQueue.slice(0, 1).pop();
    if (firstItem) {
      return this.dequeue(firstItem.id);
    }

    return undefined;
  }

  public dequeue(id: string) {
    this.debug('dequeue', id);
    const itemIndex = this.pendingWorkQueue.findIndex((item) => item.id === id);
    if (itemIndex > -1) {
      return this.pendingWorkQueue.splice(itemIndex, 1).pop();
    }
    return undefined;
  }

  private dequeueWorkInProgress(id: string) {
    this.debug('dequeueWorkInProgress', id);
    const index = this.runningWorkQueue.findIndex(
      (item) => item.queuedWork.id === id
    );
    if (index > -1) {
      return this.runningWorkQueue.splice(index, 1).pop();
    }
    return undefined;
  }

  public stopAll() {
    this.pendingWorkQueue.forEach((item) => item.stop());
    this.runningWorkQueue.forEach((item) => item.queuedWork.stop());
  }
}

export namespace PooledExecutor {
  export interface Work<Return> {
    functionName: string;
    function: {
      (...args: any[]): Return;
      name: string;
    };
    args: any[];
  }

  export interface QueuedWork<Return, Status> {
    id: string;
    work: Work<Return>;
    stop: () => void;
    onData: (data: Return) => void;
    onError: (error: any) => void;
    onStatus: (status: Status) => void;
  }

  export interface QueuedWorkInProgress<Return, Status> {
    queuedWork: PooledExecutor.QueuedWork<Return, Status>;
    processor: PooledExecutor.Processor;
  }

  export type QueuedWorkInProgressCallback = (
    workInProgress: QueuedWorkInProgress<any, any>
  ) => void;

  export interface WorkHandler<Return, Status> {
    id: string;
    data: Promise<Return>;
    status: Subject<Status>;
    stop: () => void;
  }

  export interface Processor {
    execute<Return, Status>(
      work: Work<Return>,
      onStatus: (status: Status) => void
    ): Promise<Return>;
    stop(): void;
  }

  export class WebWorkerProcessor implements Processor {
    private worker?: Worker;

    public constructor(private readonly workerGenerator: () => Worker) {}

    protected getWorker(): Worker {
      if (!this.worker) {
        this.worker = this.workerGenerator();
      }

      return this.worker;
    }

    public execute<Return, Status>(
      work: Work<Return>,
      onStatus: (status: Status) => void
    ): Promise<Return> {
      const worker = this.getWorker();

      const result = new Promise<Return>((res, rej) => {
        worker.onmessage = ({ data }) => {
          if (isResultMessage(data)) {
            res(data.data);
          } else if (isStatusMessage(data)) {
            onStatus(data.data.data);
          }
        };
        worker.onerror = rej;
        worker.onmessageerror = rej;
      }).finally(() => {
        worker.onmessage = () => undefined;
        worker.onerror = () => undefined;
        worker.onmessageerror = () => undefined;
      });

      worker.postMessage(newRunMessage(work.functionName, work.args));

      return result;
    }

    public stop(): void {
      this.worker?.terminate();
      this.worker = undefined;
    }
  }

  export class LocalProcessor implements Processor {
    public async execute<Return, Status>(
      work: Work<Return>,
      onStatus: (status: Status) => void
    ): Promise<Return> {
      const dispatchStatus = (status: any) => {
        onStatus(status.detail.data);
      };
      self.addEventListener(PROGRESS_STATUS_EVENT, dispatchStatus);

      const result = await work.function(...work.args);

      self.removeEventListener(PROGRESS_STATUS_EVENT, dispatchStatus);

      return result;
    }

    public stop(): void {
      // Empty because this cannot be supported on single threads.
      // console.warn(
      //   `${LocalProcessor.name}.${this.stop.name}() is not supported.`
      // );
    }
  }
}

type GenericFunction = (...args: any[]) => any;
type ObjectOfGenericFunctions = { [key: string | symbol]: GenericFunction };

export type PooledWorkerClientFunctionsType<
  T extends ObjectOfGenericFunctions
> = {
  // We take just the method key and Promisify them,
  // We have to use T[P] & Function because the compiler will not realize T[P] will always be a function
  [P in JustMethodKeys<T>]: (
    ...a: ArgumentTypes<T[P]>
  ) => PooledExecutor.WorkHandler<ReturnType<T[P]>, ProgressStatus>;
};

/**
 * Takes an object of functions and wraps the functions in a pooled executor.
 * @param executor
 * @param sourceObject
 */
export function pooledFunctions<T extends ObjectOfGenericFunctions>(
  executor: PooledExecutor,
  sourceObject: T
): PooledWorkerClientFunctionsType<T> {
  return new Proxy(sourceObject, {
    get(target: any, prop: string | symbol): any {
      return (...args: any[]) => {
        return executor.enqueue({
          args,
          functionName: prop.toString(),
          function: (sourceObject as any)[prop],
        });
      };
    },
  });
}
