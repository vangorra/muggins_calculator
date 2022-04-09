import {Configuration, ThemeEnum,} from './general_types';
import {range} from 'lodash';
import {OperationEnum, OPERATIONS} from "./solver/solver";

export const DEFAULT_DIE_FACE_COUNT = 6;
export const DEFAULT_DIE_SELECTED_FACE = 1;

const DEFAULT_OPERATIONS = [
  OperationEnum.PLUS,
  OperationEnum.MINUS,
  OperationEnum.MULTIPLY,
  OperationEnum.DIVIDE,
];

export const DEFAULT_CONFIGURATION: Configuration = {
  theme: ThemeEnum.AUTOMATIC,
  operations: Object.fromEntries([
    ...OPERATIONS.map((operation) => [operation.id, false]),
    ...DEFAULT_OPERATIONS.map(operationId => [operationId, true])
  ]),
  board: {
    minSize: 1,
    maxSize: 36,
  },
  dice: range(3).map(() => ({
    faceCount: DEFAULT_DIE_FACE_COUNT,
  })),
};
