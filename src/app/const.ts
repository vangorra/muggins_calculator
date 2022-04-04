import { Config, Operation, OperationId } from './general_types';

export const DEFAULT_DICE_COUNT = 3;
export const DEFAULT_DIE_SELECTED_FACE_COUNT = 6;
export const DEFAULT_DIE_SELECTED_FACE = 1;
export const DEFAULT_BOARD_MIN_NUMBER = 1;
export const DEFAULT_BOARD_MAX_NUMBER = 36;
export const DEFAULT_CUSTOMIZE_DIE_FACE_COUNT = false;

const GROUPING_PARENTHESIS = (text: string) => `(${text})`;
const GROUPING_NONE = (text: string) => text;

export const ALL_OPERATIONS: Operation[] = [
  {
    name: 'Plus',
    id: OperationId.PLUS,
    solve: (a: number, b: number) => a + b,
    display: (a: string, b: string) => `${a} + ${b}`,
    grouping: GROUPING_PARENTHESIS,
  },
  {
    name: 'Minus',
    id: OperationId.MINUS,
    solve: (a: number, b: number) => a - b,
    display: (a: string, b: string) => `${a} - ${b}`,
    grouping: GROUPING_PARENTHESIS,
  },
  {
    name: 'Multiply',
    id: OperationId.MULTIPLY,
    solve: (a: number, b: number) => a * b,
    display: (a: string, b: string) => `${a} * ${b}`,
    grouping: GROUPING_PARENTHESIS,
  },
  {
    name: 'Divide',
    id: OperationId.DIVIDE,
    solve: (a: number, b: number) => a / b,
    display: (a: string, b: string) => `${a} / ${b}`,
    grouping: GROUPING_PARENTHESIS,
  },
  {
    name: 'Power',
    id: OperationId.POWER,
    solve: (a: number, b: number) => a ** b,
    display: (a: string, b: string) => `${a} ^ ${b}`,
    grouping: GROUPING_NONE,
  },
  {
    name: 'Root',
    id: OperationId.ROOT,
    solve: (a: number, b: number) => Math.pow(a, 1 / b),
    display: (a: string, b: string) => `root(${a})(${b})`,
    grouping: GROUPING_NONE,
  },
  {
    name: 'Modulo',
    id: OperationId.MODULO,
    solve: (a: number, b: number) => a % b,
    display: (a: string, b: string) => `${a} % ${b}`,
    grouping: GROUPING_PARENTHESIS,
  },
];

// @ts-ignore
export const OPERATIONS: { [id in OperationId]: Operation } =
  Object.fromEntries(
    ALL_OPERATIONS.map((operation) => [operation.id, operation])
  );

export const DEFAULT_OPERATIONS = [
  OPERATIONS.plus,
  OPERATIONS.minus,
  OPERATIONS.multiply,
  OPERATIONS.divide,
];

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
