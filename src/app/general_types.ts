export enum ThemeEnum {
  AUTOMATIC = 'automatic',
  DARK = 'dark',
  LIGHT = 'light',
}

export type ThemeType = `${ThemeEnum}`;

export enum OperationEnum {
  PLUS = 'plus',
  MINUS = 'minus',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
  POWER = 'power',
  ROOT = 'root',
  MODULO = 'modulo',
}

export type OperationType = `${OperationEnum}`;

export interface DiceConfiguration {
  faceCount: number;
}

export interface BoardConfiguration {
  minSize: number;
  maxSize: number;
}

export type OperationsConfiguration = { [id in OperationEnum]: boolean };

export interface Configuration {
  readonly theme: ThemeType;
  readonly operations: OperationsConfiguration;
  readonly board: BoardConfiguration;
  readonly dice: DiceConfiguration[];
}

export interface Config {
  readonly boardMinNumber: number;
  readonly boardMaxNumber: number;
  readonly diceCount: number;
  readonly operations: Operation[];
  readonly customizeDieFaceCount: boolean;
}

export interface Die {
  readonly faceCount: number;
  readonly selectedFace: number;
}

export interface Operation {
  readonly name: string;
  readonly id: OperationEnum;
  readonly solve: (a: number, b: number) => number;
  readonly display: (a: string, b: string) => string;
  readonly grouping: (text: string) => string;
}

export interface SolverWorkerMessage {
  readonly boardMinNumber: number;
  readonly boardMaxNumber: number;
  readonly diceFaces: number[];
  readonly operators: string[];
}

export interface SolverWorkerResponse {
  readonly [total: number]: string[];
}

export interface TypedWorker<M, R> extends Worker {
  onmessage: ((this: Worker, ev: MessageEvent<R>) => any) | null;
  postMessage(message: M, transfer: Transferable[]): void;
  postMessage(message: M, options?: any): void;
}
