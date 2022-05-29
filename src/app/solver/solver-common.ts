import { uniqBy, range } from 'lodash';

export interface PairingEntry {}

interface SinglePairingEntry extends PairingEntry {
  readonly value: number;
}

interface DoublePairingEntry extends PairingEntry {
  readonly left: number;
  readonly right: number;
}

function isSinglePairingEntry(object: any): object is SinglePairingEntry {
  return 'value' in object && Number.isFinite(object.value);
}

function isDoublePairingEntry(object: any): object is DoublePairingEntry {
  return (
    'left' in object &&
    'right' in object &&
    typeof object.left === 'object' &&
    typeof object.right === 'object'
  );
}

export const enum OperationEnum {
  PLUS = 'plus',
  MINUS = 'minus',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
  POWER = 'power',
  ROOT = 'root',
  MODULO = 'modulo',
}

export interface Operation {
  readonly name: string;
  readonly id: OperationEnum;
  readonly solve: (left: number, right: number) => number;
  readonly display: (left: any, right: any) => string;
  readonly displayGroup: (text: string) => string;
  readonly isCommutative: boolean;
  readonly exampleNumbers: {
    readonly left: number;
    readonly right: number;
  };
}

export interface MugginsSolverConfig {
  readonly useWorker: boolean;
  readonly workerCount: number;
}

export interface MugginsSolverCalculateConfig {
  readonly minTotal: number;
  readonly maxTotal: number;
  readonly faces: number[];
  readonly operations: OperationEnum[];
}

export interface CalculateEquationResult {
  readonly total: number;
  readonly equation: string;
  readonly fullEquation: string;
  readonly sortableEquation: string;
}

export interface IntermediateResult {
  readonly total: number;
  readonly equation: string;
  readonly isLeaf: boolean;
}

export const EQUATION_FORMATTER = (total: string | number, equation: string) =>
  `${total} = ${equation}`;
const GROUPING_PARENTHESIS = (text: string) => `(${text})`;
const GROUPING_NONE = (text: string) => text;

export const OPERATIONS: Operation[] = [
  {
    name: 'Plus',
    id: OperationEnum.PLUS,
    solve: (left: number, right: number) => left + right,
    display: (left: any, right: any) => `${left} + ${right}`,
    displayGroup: GROUPING_PARENTHESIS,
    isCommutative: true,
    exampleNumbers: {
      left: 6,
      right: 2,
    },
  },
  {
    name: 'Minus',
    id: OperationEnum.MINUS,
    solve: (left: number, right: number) => left - right,
    display: (left: any, right: any) => `${left} - ${right}`,
    displayGroup: GROUPING_PARENTHESIS,
    isCommutative: false,
    exampleNumbers: {
      left: 6,
      right: 2,
    },
  },
  {
    name: 'Multiply',
    id: OperationEnum.MULTIPLY,
    solve: (left: number, right: number) => left * right,
    display: (left: any, right: any) => `${left} * ${right}`,
    displayGroup: GROUPING_PARENTHESIS,
    isCommutative: true,
    exampleNumbers: {
      left: 6,
      right: 2,
    },
  },
  {
    name: 'Divide',
    id: OperationEnum.DIVIDE,
    solve: (left: number, right: number) => left / right,
    display: (left: any, right: any) => `${left} / ${right}`,
    displayGroup: GROUPING_PARENTHESIS,
    isCommutative: false,
    exampleNumbers: {
      left: 6,
      right: 2,
    },
  },
  {
    name: 'Power',
    id: OperationEnum.POWER,
    solve: (left: number, right: number) => left ** right,
    display: (left: any, right: any) => `${left} ^ ${right}`,
    displayGroup: GROUPING_NONE,
    isCommutative: false,
    exampleNumbers: {
      left: 5,
      right: 2,
    },
  },
  {
    name: 'Root',
    id: OperationEnum.ROOT,
    solve: (left: number, right: number) => Math.pow(left, 1 / right),
    display: (left: any, right: any) => `root(${left})(${right})`,
    displayGroup: GROUPING_NONE,
    isCommutative: false,
    exampleNumbers: {
      left: 27,
      right: 3,
    },
  },
  {
    name: 'Modulo',
    id: OperationEnum.MODULO,
    solve: (left: number, right: number) => left % right,
    display: (left: any, right: any) => `${left} % ${right}`,
    displayGroup: GROUPING_PARENTHESIS,
    isCommutative: false,
    exampleNumbers: {
      left: 5,
      right: 3,
    },
  },
];

type OperationMapType = { [id in OperationEnum]: Operation };
export const OPERATIONS_MAP: OperationMapType = Object.fromEntries(
  OPERATIONS.map((operation) => [operation.id, operation])
) as OperationMapType;

const SORTABLE_EQUATION_REGEX_REPLACEMENTS: [RegExp, string][] = [
  [/[\\(]/g, 'X'],
  [/[\\)]/g, 'Y'],
  [/=/g, 'Z'],
];

/**
 * In ASCII, operators like + - /, etc come before numbers. This means when sorting equations at the end,
 * the operators take precedence. So equations like '(8 + 1) + 2' come before '2 + (8 + 1)'. To fix this,
 * we replace non-alphanum with Z. This ensures the numbers are prioritized and parenthesis
 * are sort to the bottom.
 * @param equation
 */
export function getSortableEquation(equation: string): string {
  let newEquation = equation;
  SORTABLE_EQUATION_REGEX_REPLACEMENTS.forEach(
    ([regexp, replacement]) =>
      (newEquation = newEquation.replace(regexp, replacement))
  );
  return newEquation;
}

class Equation {
  private static calculateResultSorter(
    a: IntermediateResult,
    b: IntermediateResult
  ): number {
    if (a.isLeaf && a.total < b.total) {
      return -1;
    }
    if (b.isLeaf && b.total < a.total) {
      return 1;
    }
    if (a.isLeaf) {
      return -1;
    }
    if (b.isLeaf) {
      return 1;
    }
    if (a.total < b.total) {
      return -1;
    }
    if (b.total < a.total) {
      return 1;
    }
    return 0;
  }

  private static calculateResultReducer(
    left: IntermediateResult,
    right: IntermediateResult,
    operation: Operation,
    isRoot: boolean
  ): IntermediateResult {
    // Solve the equation.
    const total = operation.solve(left.total, right.total);

    // Cannot be solved.
    if (!Number.isFinite(total)) {
      throw new Error(`Non-finite number returned ${total}.`);
    }

    // Sort commutative values. This helps reduce duplicates later.
    if (operation.isCommutative) {
      [left, right] = [left, right].sort(Equation.calculateResultSorter);
    }

    const groupFn = isRoot ? GROUPING_NONE : operation.displayGroup;
    const equation = groupFn(operation.display(left.equation, right.equation));
    return {
      total,
      equation,
      isLeaf: false,
    };
  }

  public static calculate(
    pairing: PairingEntry,
    operations: Operation[],
    isRoot = true
  ): IntermediateResult {
    if (isSinglePairingEntry(pairing)) {
      return {
        total: pairing.value,
        equation: `${pairing.value}`,
        isLeaf: true,
      };
    }

    if (isDoublePairingEntry(pairing)) {
      const operation = operations[operations.length - 1];
      const nextOperations = operations.slice(0, operations.length - 1);
      const [left, right] = [pairing.left, pairing.right].map((pairMember) =>
        Equation.calculate(pairMember, nextOperations, false)
      );
      return Equation.calculateResultReducer(left, right, operation, isRoot);
    }

    throw new Error('Unexpected type: ' + typeof pairing);
  }
}

/**
 * Iterative cross-product of variable sized arrays.
 * Original source: https://stackoverflow.com/a/4331713
 * @param arr1
 * @param arr2
 */
function crossProduct<T1, T2>(arr1: T1[], arr2: T2[]): [T1, T2][];
function crossProduct<T1, T2, T3>(
  arr1: T1[],
  arr2: T2[],
  arr3: T3[]
): [T1, T2, T3][];
function crossProduct<T>(...sourceArrays: T[][]): T[][];
function crossProduct(...sourceArrays: any[][]): any[][] {
  const sourceArraysIndexes = range(sourceArrays.length);

  // Pre-calculate divisors
  const divisors: number[] = [];
  sourceArraysIndexes
    .slice()
    .reverse()
    .forEach((sourceArraysIndex) => {
      const nextSourceArrayIndex = sourceArraysIndex + 1;
      const nextDivisor = divisors[nextSourceArrayIndex];
      if (nextDivisor) {
        divisors[sourceArraysIndex] =
          nextDivisor * sourceArrays[nextSourceArrayIndex].length;
      } else {
        divisors[sourceArraysIndex] = 1;
      }
    });

  // Calculate the total number of results that will be returned.
  const totalResults = sourceArrays
    .map((arr) => arr.length)
    .reduce((x, y) => x * y);
  return range(totalResults).map((permutationIndex) => {
    // Calculate the current result based on the permutation index.
    return sourceArraysIndexes.map((sourceArraysIndex) => {
      const currentArray = sourceArrays[sourceArraysIndex];
      return currentArray[
        Math.floor(permutationIndex / divisors[sourceArraysIndex]) %
          currentArray.length
      ];
    });
  });
}

interface MergeSortConfig<T> {
  readonly compare: (a: T, b: T) => number;
  readonly unique: boolean;
}

/**
 * A merge sort algorithm that exposes the merge function. This is used to distribute
 * sorting across workers.
 */
export class MergeSort {
  /**
   * Merge function that support N arrays as opposed to the 2 that traditionally is used in merge sort.
   * This allows multiple sorted arrays to be merged together. Very useful when each array was sorted
   * across different workers.
   * @param sourceArrays
   * @param config
   */
  public static merge<T>(sourceArrays: T[][], config: MergeSortConfig<T>): T[] {
    if (sourceArrays.length === 0) {
      return [];
    }

    if (sourceArrays.length === 1) {
      return sourceArrays[0];
    }

    if (sourceArrays.length === 2) {
      const results: T[] = [];
      const leftArray = sourceArrays[0];
      const rightArray = sourceArrays[1];
      let leftIndex = 0;
      let rightIndex = 0;
      while (leftIndex < leftArray.length && rightIndex < rightArray.length) {
        const leftValue = leftArray[leftIndex];
        const rightValue = rightArray[rightIndex];
        const comp = config.compare(leftValue, rightValue);
        if (comp < 0) {
          results.push(leftValue);
          leftIndex += 1;
        } else if (comp > 0) {
          results.push(rightValue);
          rightIndex += 1;
        } else if (config.unique) {
          results.push(leftValue);
          leftIndex += 1;
          rightIndex += 1;
        } else {
          results.push(leftValue);
          results.push(rightValue);
          leftIndex += 1;
          rightIndex += 1;
        }
      }

      return [
        ...results,
        ...leftArray.slice(leftIndex),
        ...rightArray.slice(rightIndex),
      ];
    }

    const result = range(0, sourceArrays.length, 2).map((index) =>
      MergeSort.merge(sourceArrays.slice(index, index + 2), config)
    );

    return MergeSort.merge(result, config);
  }

  /**
   * Standard merge sort that splits the source in two groups and recursively splits and merges.
   * @param items
   * @param config
   */
  public static sort<T>(items: T[], config: MergeSortConfig<T>): T[] {
    const half = Math.floor(items.length / 2);

    // Base case or terminating case
    if (items.length < 2) {
      return items;
    }

    const left = items.slice(0, half);
    const right = items.slice(half, items.length);
    return MergeSort.merge(
      [MergeSort.sort(left, config), MergeSort.sort(right, config)],
      config
    );
  }
}

/**
 * Given a list of items like [1, 2, 3], return all possible combinations like,
 * [
 *   [1, 2, 3],
 *   [1, 3, 2],
 *   [2, 1, 3],
 *   [2, 3, 1],
 *   [3, 1, 2],
 *   [3, 2, 1],
 * ]
 * @param items
 */
function permutations<T>(items: T[]): T[][] {
  const ret: T[][] = [];

  for (let i = 0; i < items.length; i += 1) {
    const rest = permutations(items.slice(0, i).concat(items.slice(i + 1)));

    if (!rest.length) {
      ret.push([items[i]]);
    } else {
      for (let j = 0; j < rest.length; j += 1) {
        ret.push([items[i]].concat(rest[j]));
      }
    }
  }
  return ret;
}

/**
 * Given a list of pairing entries like
 * [
 *  { value: 1 },
 *  { value: 2 },
 *  { value: 3 },
 * ]
 * Return a list of all possible pairing permutations like
 * [
 *  {
 *    left: {
 *      left: { value: 1 },
 *      right: { value: 2 },
 *    },
 *    right: { value: 3 },
 *  },
 *  {
 *    left: { value: 1 },
 *    right: {
 *      left: { value: 2 },
 *      right: { value: 3 },
 *    ,}
 *  },
 * ].
 * @param arr
 */
function pairingPermutations(arr: PairingEntry[]): PairingEntry[] {
  // Not enough items to pair.
  if (arr.length == 1) {
    return arr;
  }

  return range(arr.length - 1).flatMap((index) => {
    // Copy the arr.
    const permutation = arr.slice();
    // Replace part of the array with a pair.
    const [left, right] = permutation.slice(index, index + 2);
    permutation.splice(index, 2, {
      left,
      right,
    });

    return pairingPermutations(permutation);
  });
}

function compareCalculateEquationResult(
  a: CalculateEquationResult,
  b: CalculateEquationResult
): number {
  if (a.sortableEquation < b.sortableEquation) {
    return -1;
  }

  if (a.sortableEquation > b.sortableEquation) {
    return 1;
  }

  return 0;
}

function sortCalculateResults(
  results: CalculateEquationResult[]
): CalculateEquationResult[] {
  return MergeSort.sort(results, {
    compare: compareCalculateEquationResult,
    unique: true,
  });
}

function mergeCalculateResultsArrays(
  results: CalculateEquationResult[][]
): CalculateEquationResult[] {
  return MergeSort.merge(results, {
    compare: compareCalculateEquationResult,
    unique: true,
  });
}

function getFacePairingPermutations(faces: number[]): PairingEntry[] {
  // Get unique face permutations.
  const facePermutations = uniqBy(permutations(faces), (arr) =>
    arr.join('_')
  ).map((faceArr) => faceArr.map((face) => ({ value: face })));

  // Pair faces together.
  return facePermutations.flatMap((f) => pairingPermutations(f));
}

function getOperationPermutations(
  config: MugginsSolverCalculateConfig
): OperationEnum[][] {
  // Get unique operation permutations.
  return uniqBy(
    crossProduct(...config.faces.slice(1).map(() => config.operations)),
    (operations) => operations.join('_')
  );
}

function getFaceAndOperationPermutations(
  config: MugginsSolverCalculateConfig
): [PairingEntry[], OperationEnum[][]] {
  return [
    getFacePairingPermutations(config.faces),
    getOperationPermutations(config),
  ];
}

function getFaceOperationPermutations(
  facePairingPermutations: PairingEntry[],
  operationPermutations: OperationEnum[][]
): [PairingEntry, OperationEnum[]][] {
  // Get the final combination of face pairing and operations.
  return crossProduct(facePairingPermutations, operationPermutations);
}

function calculate(
  config: MugginsSolverCalculateConfig,
  data: [PairingEntry, OperationEnum[]][]
): CalculateEquationResult[] {
  return data
    .map(([pairingEntry, operations]) => {
      try {
        return Equation.calculate(
          pairingEntry,
          operations.map((operation) => OPERATIONS_MAP[operation])
        );
      } catch (e) {
        return;
      }
    })
    .filter(
      (result) =>
        !!result &&
        Number.isInteger(result.total) &&
        result.total >= config.minTotal &&
        result.total <= config.maxTotal
    )
    .map((result) => {
      const { total, equation } = result as IntermediateResult;

      return {
        total,
        equation,
        fullEquation: EQUATION_FORMATTER(total, equation),
        sortableEquation: getSortableEquation(
          EQUATION_FORMATTER(`${total}`.padStart(4, '0'), equation)
        ),
      };
    });
}

function calculateFromFaceAndOperationPermutations(
  config: MugginsSolverCalculateConfig,
  facePairingPermutations: PairingEntry[],
  operationPermutations: OperationEnum[][]
): CalculateEquationResult[] {
  const faceOperationPermutations = getFaceOperationPermutations(
    facePairingPermutations,
    operationPermutations
  );
  return sortCalculateResults(calculate(config, faceOperationPermutations));
}

/**
 * Get an estimate on the number of results that would be retrieved. This does not
 * consider deduplication.
 * @param config
 */
export function getCalculateComplexity(
  config: MugginsSolverCalculateConfig
): number {
  const faceCountFactorial = config.faces
    .map((v, index) => index + 1)
    .reduce((a, b) => a * b);
  const facePermutations = faceCountFactorial;
  const facePairing = faceCountFactorial;
  const facePairingPermutations = facePermutations * facePairing;
  const operationPermutations =
    config.operations.length * config.operations.length;
  return facePairingPermutations * operationPermutations;
}

export const commonWorkerFunctions = {
  getFaceAndOperationPermutations,
  getFacePairingPermutations,
  getOperationPermutations,
  getFaceOperationPermutations,
  calculateFromFaceAndOperationPermutations,
  sortCalculateResults,
  mergeCalculateResultsArrays,
};
