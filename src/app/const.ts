import {Configuration, Operation, OperationEnum, ThemeEnum,} from './general_types';
import {range} from 'lodash';

export const DEFAULT_DIE_FACE_COUNT = 6;
export const DEFAULT_DIE_SELECTED_FACE = 1;

const GROUPING_PARENTHESIS = (text: string) => `(${text})`;
const GROUPING_NONE = (text: string) => text;

export const OPERATIONS_ARRAY: Operation[] = [
  {
    name: 'Plus',
    id: OperationEnum.PLUS,
    solve: (a: number, b: number) => a + b,
    display: (a: string, b: string) => `${a} + ${b}`,
    grouping: GROUPING_PARENTHESIS,
    orderMatters: false,
  },
  {
    name: 'Minus',
    id: OperationEnum.MINUS,
    solve: (a: number, b: number) => a - b,
    display: (a: string, b: string) => `${a} - ${b}`,
    grouping: GROUPING_PARENTHESIS,
    orderMatters: true,
  },
  {
    name: 'Multiply',
    id: OperationEnum.MULTIPLY,
    solve: (a: number, b: number) => a * b,
    display: (a: string, b: string) => `${a} * ${b}`,
    grouping: GROUPING_PARENTHESIS,
    orderMatters: false,
  },
  {
    name: 'Divide',
    id: OperationEnum.DIVIDE,
    solve: (a: number, b: number) => a / b,
    display: (a: string, b: string) => `${a} / ${b}`,
    grouping: GROUPING_PARENTHESIS,
    orderMatters: true,
  },
  {
    name: 'Power',
    id: OperationEnum.POWER,
    solve: (a: number, b: number) => a ** b,
    display: (a: string, b: string) => `${a} ^ ${b}`,
    grouping: GROUPING_NONE,
    orderMatters: true,
  },
  {
    name: 'Root',
    id: OperationEnum.ROOT,
    solve: (a: number, b: number) => Math.pow(a, 1 / b),
    display: (a: string, b: string) => `root(${a})(${b})`,
    grouping: GROUPING_NONE,
    orderMatters: true,
  },
  {
    name: 'Modulo',
    id: OperationEnum.MODULO,
    solve: (a: number, b: number) => a % b,
    display: (a: string, b: string) => `${a} % ${b}`,
    grouping: GROUPING_PARENTHESIS,
    orderMatters: true,
  },
];

const DEFAULT_OPERATIONS = [
  OperationEnum.PLUS,
  OperationEnum.MINUS,
  OperationEnum.MULTIPLY,
  OperationEnum.DIVIDE,
]

export const DEFAULT_CONFIGURATION: Configuration = {
  theme: ThemeEnum.AUTOMATIC,
  operations: Object.fromEntries([
    ...OPERATIONS_ARRAY.map((operation) => [operation.id, false]),
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
