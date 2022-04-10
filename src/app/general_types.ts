import { CalculateResult, OperationEnum } from './solver/solver';

export const enum ThemeEnum {
  AUTOMATIC = 'automatic',
  DARK = 'dark',
  LIGHT = 'light',
}

interface ThemeConfig {
  name: string;
  theme: ThemeEnum;
}

export const THEME_CONFIGS: ThemeConfig[] = [
  {
    name: 'Automatic',
    theme: ThemeEnum.AUTOMATIC,
  },
  {
    name: 'Dark',
    theme: ThemeEnum.DARK,
  },
  {
    name: 'Light',
    theme: ThemeEnum.LIGHT,
  },
];

export interface DiceConfiguration {
  faceCount: number;
}

export interface Configuration {
  // readonly theme: ThemeType;
  readonly theme: ThemeEnum;
  readonly operations: OperationEnum[];
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
  readonly operations: string[];
}

export type SolverWorkerResponseDataArray = {
  total: string;
  results: CalculateResult[];
}[];

export interface SolverWorkerResponse {
  readonly data: SolverWorkerResponseDataArray;
}

export interface TypedWorker<M, R> extends Worker {
  onmessage: ((this: Worker, ev: MessageEvent<R>) => any) | null;
  postMessage(message: M, transfer: Transferable[]): void;
  postMessage(message: M, options?: any): void;
}
