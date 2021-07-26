export interface Config {
  boardMinNumber: number;
  boardMaxNumber: number;
  diceCount: number;
  operations: Operation[];
  customizeDieFaceCount: boolean;
}

export interface Die {
  selectedFaceCount: number;
  selectedFace: number;
}

export interface Operation {
  name: string;
  operationFunction: (a: number, b: number) => number;
  operator: string;
}

export interface SolverWorkerMessage {
  boardMinNumber: number;
  boardMaxNumber: number;
  selectedDieFaces: number[];
  selectedOperators: string[];
}

export interface SolverWorkerResponse {
  [total: number]: string[];
}

export interface TypedWorker<M, R> extends Worker {
  onmessage: ((this: Worker, ev: MessageEvent<R>) => any) | null;
  postMessage(message: M, transfer: Transferable[]): void;
  postMessage(message: M, options?: PostMessageOptions): void;
}
