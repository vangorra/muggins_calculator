import { OperationEnum } from '@muggins_calculator/common';

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

export const enum CalculationModeEnum {
  PRECOMPUTED_IF_AVAILABLE = 'precomputed_if_available',
  LOCAL_ONLY = 'local_only',
}

interface CalculationModeConfig {
  name: string;
  mode: CalculationModeEnum;
}

export const CALCULATION_MODE_CONFIGS: CalculationModeConfig[] = [
  {
    name: 'Use Precomputed Solutions (If Available)',
    mode: CalculationModeEnum.PRECOMPUTED_IF_AVAILABLE,
  },
  {
    name: 'Always Compute Locally (Can Be Slow)',
    mode: CalculationModeEnum.LOCAL_ONLY,
  },
];

export interface DieConfiguration {
  readonly faceCount: number;
  readonly selectedFace: number;
}

export interface Configuration {
  readonly theme: ThemeEnum;
  readonly calculationMode: CalculationModeEnum;
  readonly operations: OperationEnum[];
  readonly board: {
    minSize: number;
    maxSize: number;
  };
  readonly dice: DieConfiguration[];
}

export interface Die {
  readonly index: number;
  readonly faceCount: number;
  readonly selectedFace: number;
}
