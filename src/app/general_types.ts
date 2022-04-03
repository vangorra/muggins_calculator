export interface Config {
  readonly boardMinNumber: number;
  readonly boardMaxNumber: number;
  readonly diceCount: number;
  readonly operations: Operation[];
  readonly customizeDieFaceCount: boolean;
}

export interface Die {
  readonly selectedFaceCount: number;
  readonly selectedFace: number;
}

export interface Operation {
  readonly name: string;
  readonly operationFunction: (a: number, b: number) => number;
  readonly operator: string;
}

export interface SolverWorkerMessage {
  readonly boardMinNumber: number;
  readonly boardMaxNumber: number;
  readonly selectedDieFaces: number[];
  readonly selectedOperators: string[];
}

export interface SolverWorkerResponse {
  readonly [total: number]: string[];
}

export interface TypedWorker<M, R> extends Worker {
  onmessage: ((this: Worker, ev: MessageEvent<R>) => any) | null;
  postMessage(message: M, transfer: Transferable[]): void;
  postMessage(message: M, options?: PostMessageOptions): void;
}
