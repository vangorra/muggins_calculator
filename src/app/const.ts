import { Configuration, ThemeEnum } from './general_types';
import { range } from 'lodash';
import { OperationEnum } from './solver/solver';

export const DEFAULT_DIE_FACE_COUNT = 6;
export const DEFAULT_DIE_SELECTED_FACE = 1;
export const DEFAULT_DIE_COUNT = 3;

export const DEFAULT_CONFIGURATION: Configuration = {
  theme: ThemeEnum.AUTOMATIC,
  operations: [
    OperationEnum.PLUS,
    OperationEnum.MINUS,
    OperationEnum.MULTIPLY,
    OperationEnum.DIVIDE,
  ],
  board: {
    minSize: 1,
    maxSize: 36,
  },
  dice: range(DEFAULT_DIE_COUNT).map(() => ({
    faceCount: DEFAULT_DIE_FACE_COUNT,
    selectedFace: DEFAULT_DIE_SELECTED_FACE,
  })),
};

export const STORAGE_KEY_404_REDIRECT_PATH = '404_redirect_path';
