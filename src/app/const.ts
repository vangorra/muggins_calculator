import {
  Config,
  Configuration,
  Operation,
  OperationEnum,
  ThemeEnum,
} from './general_types';
import { range } from 'lodash';

export const DEFAULT_DICE_COUNT = 3;
export const DEFAULT_DIE_SELECTED_FACE_COUNT = 6;
export const DEFAULT_DIE_SELECTED_FACE = 1;
export const DEFAULT_BOARD_MIN_NUMBER = 1;
export const DEFAULT_BOARD_MAX_NUMBER = 36;
export const DEFAULT_CUSTOMIZE_DIE_FACE_COUNT = false;
export const DEFAULT_THEME = ThemeEnum.AUTOMATIC;

const GROUPING_PARENTHESIS = (text: string) => `(${text})`;
const GROUPING_NONE = (text: string) => text;

export const ALL_OPERATIONS: Operation[] = [
  {
    name: 'Plus',
    id: OperationEnum.PLUS,
    solve: (a: number, b: number) => a + b,
    display: (a: string, b: string) => `${a} + ${b}`,
    grouping: GROUPING_PARENTHESIS,
  },
  {
    name: 'Minus',
    id: OperationEnum.MINUS,
    solve: (a: number, b: number) => a - b,
    display: (a: string, b: string) => `${a} - ${b}`,
    grouping: GROUPING_PARENTHESIS,
  },
  {
    name: 'Multiply',
    id: OperationEnum.MULTIPLY,
    solve: (a: number, b: number) => a * b,
    display: (a: string, b: string) => `${a} * ${b}`,
    grouping: GROUPING_PARENTHESIS,
  },
  {
    name: 'Divide',
    id: OperationEnum.DIVIDE,
    solve: (a: number, b: number) => a / b,
    display: (a: string, b: string) => `${a} / ${b}`,
    grouping: GROUPING_PARENTHESIS,
  },
  {
    name: 'Power',
    id: OperationEnum.POWER,
    solve: (a: number, b: number) => a ** b,
    display: (a: string, b: string) => `${a} ^ ${b}`,
    grouping: GROUPING_NONE,
  },
  {
    name: 'Root',
    id: OperationEnum.ROOT,
    solve: (a: number, b: number) => Math.pow(a, 1 / b),
    display: (a: string, b: string) => `root(${a})(${b})`,
    grouping: GROUPING_NONE,
  },
  {
    name: 'Modulo',
    id: OperationEnum.MODULO,
    solve: (a: number, b: number) => a % b,
    display: (a: string, b: string) => `${a} % ${b}`,
    grouping: GROUPING_PARENTHESIS,
  },
];

// @ts-ignore
export const OPERATIONS: { [id in OperationEnum]: Operation } =
  Object.fromEntries(
    ALL_OPERATIONS.map((operation) => [operation.id, operation])
  );

export const DEFAULT_OPERATIONS = [
  OPERATIONS.plus,
  OPERATIONS.minus,
  OPERATIONS.multiply,
  OPERATIONS.divide,
];

export const DEFAULT_OPERATION_IDS = DEFAULT_OPERATIONS.map(
  (operation) => operation.id
);

const MAX_DICE_COUNT = Math.max(DEFAULT_DICE_COUNT, 6);
export const DICE_COUNT_OPTIONS = [...new Array(MAX_DICE_COUNT).keys()].map(
  (i) => i + 1
);

const MAX_DIE_FACE_COUNT = Math.max(DEFAULT_DIE_SELECTED_FACE_COUNT, 16);
export const DIE_FACE_COUNT_OPTIONS = [
  ...new Array(MAX_DIE_FACE_COUNT).keys(),
].map((i) => i + 1);

export const DEFAULT_CONFIG: Config = {
  boardMinNumber: DEFAULT_BOARD_MIN_NUMBER,
  boardMaxNumber: DEFAULT_BOARD_MAX_NUMBER,
  diceCount: DEFAULT_DICE_COUNT,
  operations: DEFAULT_OPERATIONS,
  customizeDieFaceCount: DEFAULT_CUSTOMIZE_DIE_FACE_COUNT,
};

export const DEFAULT_OPERATIONS_OBJECT = Object.fromEntries([
  ...ALL_OPERATIONS.map((operation) => [operation.id, false]),
  ...DEFAULT_OPERATION_IDS.map((operationId) => [operationId, true]),
]);

export const DEFAULT_CONFIGURATION: Configuration = {
  theme: DEFAULT_THEME,
  operations: DEFAULT_OPERATIONS_OBJECT,
  board: {
    minSize: DEFAULT_BOARD_MIN_NUMBER,
    maxSize: DEFAULT_BOARD_MAX_NUMBER,
  },
  dice: range(DEFAULT_DICE_COUNT).map(() => ({
    faceCount: DEFAULT_DIE_SELECTED_FACE_COUNT,
  })),
};
