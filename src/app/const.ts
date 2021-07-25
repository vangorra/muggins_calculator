import {Config, Operation} from "./general_types";

export const DEFAULT_DICE_COUNT = 3;
export const DEFAULT_DIE_SELECTED_FACE_COUNT = 6;
export const DEFAULT_DIE_SELECTED_FACE = 1;
export const DEFAULT_BOARD_MIN_NUMBER = 1;
export const DEFAULT_BOARD_MAX_NUMBER = 36;
export const DEFAULT_CUSTOMIZE_DIE_FACE_COUNT = false;

export const OPERATIONS: {[name: string]: Operation} = {
  plus: {
    name: "Plus",
    operationFunction: (a: number, b: number) => a + b,
    operator: "+",
  },
  minus: {
    name: "Minus",
    operationFunction: (a: number, b: number) => a - b,
    operator: "-",
  },
  multiply: {
    name: "Multiply",
    operationFunction: (a: number, b: number) => a * b,
    operator: "x",
  },
  divide: {
    name: "Divide",
    operationFunction: (a: number, b: number) => a / b,
    operator: "/",
  },
  power: {
    name: "Power",
    operationFunction: (a: number, b: number) => a ** b,
    operator: "^",
  },
};

export const ALL_OPERATIONS = Object.values(OPERATIONS);

export const DEFAULT_OPERATIONS = [
  OPERATIONS.plus,
  OPERATIONS.minus,
  OPERATIONS.multiply,
  OPERATIONS.divide,
];

const MAX_DICE_COUNT = Math.max(DEFAULT_DICE_COUNT, 6);
export const DICE_COUNT_OPTIONS = [...new Array(MAX_DICE_COUNT).keys()].map(i => i + 1);

const MAX_DIE_FACE_COUNT = Math.max(DEFAULT_DIE_SELECTED_FACE_COUNT, 16);
export const DIE_FACE_COUNT_OPTIONS = [...new Array(MAX_DIE_FACE_COUNT).keys()].map(i => i + 1);

export const DEFAULT_CONFIG: Config = {
  boardMinNumber: DEFAULT_BOARD_MIN_NUMBER,
  boardMaxNumber: DEFAULT_BOARD_MAX_NUMBER,
  diceCount: DEFAULT_DICE_COUNT,
  operations: DEFAULT_OPERATIONS,
  customizeDieFaceCount: DEFAULT_CUSTOMIZE_DIE_FACE_COUNT,
};
