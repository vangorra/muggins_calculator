import { CalculateResult, OperationEnum } from './solver/solver';

export enum ThemeEnum {
  AUTOMATIC = 'automatic',
  DARK = 'dark',
  LIGHT = 'light',
}

export type ThemeType = `${ThemeEnum}`;

export interface DiceConfiguration {
  faceCount: number;
}

export type OperationsConfiguration = { [id in OperationEnum]: boolean };

export interface Configuration {
  readonly theme: ThemeType;
  readonly operations: OperationsConfiguration;
  readonly board: {
    minSize: number;
    maxSize: number;
  };
  readonly dice: DiceConfiguration[];
}

export interface Die {
  readonly faceCount: number;
  readonly selectedFace: number;
}

export interface SolverWorkerMessage {
  readonly boardMinNumber: number;
  readonly boardMaxNumber: number;
  readonly diceFaces: number[];
  readonly operators: string[];
}

export type SolverWorkerResponseDataArray = { total: string, results: CalculateResultWithEquation[] }[];

export interface SolverWorkerResponse {
  readonly data: SolverWorkerResponseDataArray;
}

export interface CalculateResultWithEquation extends CalculateResult {
  readonly equation: string;
}

export interface TypedWorker<M, R> extends Worker {
  onmessage: ((this: Worker, ev: MessageEvent<R>) => any) | null;
  postMessage(message: M, transfer: Transferable[]): void;
  postMessage(message: M, options?: any): void;
}
