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

export enum OperationId {
  PLUS = 'plus',
  MINUS = 'minus',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
  POWER = 'power',
  ROOT = 'root',
  MODULO = 'modulo',
}

export interface Operation {
  readonly name: string;
  readonly id: OperationId;
  readonly solve: (a: number, b: number) => number;
  readonly display: (a: string, b: string) => string;
  readonly grouping: (text: string) => string;
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
  postMessage(message: M, options?: any): void;
}
