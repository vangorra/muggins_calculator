/* eslint-disable max-classes-per-file */
/**
 * Tools for providing solutions to muggins dice.
 */

type PairingPermutation = Array<
  number | PairingPermutation | PairingPermutation[]
>;

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
  readonly minTotal: number;
  readonly maxTotal: number;
  readonly faces: number[];
  readonly operations: Operation[];
}

export interface CalculateResult {
  readonly total: number;
  readonly equation: string;
  readonly fullEquation: string;
  readonly sortableEquation: string;
  readonly isLeaf?: boolean;
}

export const EQUATION_FORMATTER = (total: string | number, equation: string) =>
  `${total} = ${equation}`;
const GROUPING_PARENTHESIS = (text: string) => `(${text})`;
const GROUPING_NONE = (text: string) => text;
const EMPTY_STRING = '';

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

/**
 * In ASCII, operators like + - /, etc come before numbers. This means when sorting equations at the end,
 * the operators take precedence. So equations like '(8 + 1) + 2' come before '2 + (8 + 1)'. To fix this,
 * we replace non-alphanum with Z. This ensures the numbers are prioritized and parenthesis
 * are sort to the bottom.
 * @param equation
 */
export function getSortableEquation(equation: string): string {
  return equation
    .replace(/[(]/g, 'X')
    .replace(/[)]/g, 'Y')
    .replace(/[=]/g, 'Z');
}

export class Equation {
  private static calculateResultSorter(
    a: CalculateResult,
    b: CalculateResult
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
    left: CalculateResult,
    right: CalculateResult,
    operation: Operation,
    isRoot: boolean
  ): CalculateResult {
    // Solve the equation.
    const total = operation.solve(left.total, right.total);

    // Cannot be solved.
    if (!Number.isFinite(total)) {
      throw new Error(`Non-finite number returned ${total}.`);
    }

    if (operation.isCommutative) {
      [left, right] = [left, right].sort(Equation.calculateResultSorter);
    }

    const groupFn = isRoot ? GROUPING_NONE : operation.displayGroup;
    const equation = groupFn(operation.display(left.equation, right.equation));
    const fullEquation = isRoot
      ? EQUATION_FORMATTER(total, equation)
      : EMPTY_STRING;
    return {
      total,
      fullEquation,
      equation,
      sortableEquation: isRoot
        ? getSortableEquation(
            EQUATION_FORMATTER(`${total}`.padStart(4, '0'), equation)
          )
        : EMPTY_STRING,
      isLeaf: false,
    };
  }

  public static calculate(
    pairing: PairingPermutation | number,
    operations: Operation[],
    isRoot = true
  ): CalculateResult {
    if (!Array.isArray(pairing)) {
      return {
        total: pairing,
        equation: `${pairing}`,
        fullEquation: EMPTY_STRING,
        sortableEquation: EMPTY_STRING,
        isLeaf: true,
      };
    }

    const operation = operations[operations.length - 1];
    const nextOperations = operations.slice(0, operations.length - 1);
    const [left, right] = pairing.map((pairMember) =>
      Equation.calculate(pairMember, nextOperations, false)
    );
    return Equation.calculateResultReducer(left, right, operation, isRoot);
  }
}

function range(size: number): number[] {
  return [...new Array(size).keys()];
}

/**
 * Iterative cross-product of variable sized arrays.
 * Original source: https://stackoverflow.com/a/4331713
 * @param sourceArrays
 */
export function crossProduct(sourceArrays: any[][]): any[][] {
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

export class MugginsSolver {
  constructor(private readonly config: MugginsSolverConfig) {}

  private static permutations<T>(items: T[]): T[][] {
    const ret: T[][] = [];

    for (let i = 0; i < items.length; i += 1) {
      const rest = MugginsSolver.permutations(
        items.slice(0, i).concat(items.slice(i + 1))
      );

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

  private pairingPermutations(
    arr: PairingPermutation,
    depth = 0
  ): PairingPermutation {
    // Not enough items to pair.
    if (arr.length < 3) {
      return [arr];
    }

    const permutations: PairingPermutation = [];
    for (let i = 0; i < arr.length - 1; i += 1) {
      const permutation = arr.slice();
      const pair = permutation.slice(i, i + 2);
      permutation.splice(i, 2, pair);

      this.pairingPermutations(permutation, depth + 1).forEach((p) =>
        permutations.push(p)
      );
    }

    return permutations;
  }

  /**
   * Get equations for the selected configurations.
   */
  public calculateSolutions(): CalculateResult[] {
    if (this.config.faces.length < 2 || this.config.operations.length === 0) {
      return [];
    }

    // Get unique face permutations.
    const facePermutations = Object.values(
      Object.fromEntries(
        MugginsSolver.permutations(this.config.faces).map((permutation) => [
          permutation.join('_'),
          permutation,
        ])
      )
    );

    // Get unique operation permutations.
    const operationPermutations = crossProduct(
      this.config.faces.slice(1).map(() => this.config.operations)
    );

    // Pair faces together.
    const facePairingPermutations = facePermutations.flatMap((f) =>
      this.pairingPermutations(f)
    );

    // Get the final combination of face pairing and operations.
    const finalProduct = crossProduct([
      facePairingPermutations,
      operationPermutations,
    ]);

    // Calculate results.
    const uniqueResults = new Set();
    const results: CalculateResult[] = [];
    for (const [pairings, operations] of finalProduct) {
      let result: CalculateResult;
      try {
        result = Equation.calculate(pairings, operations);
      } catch (e) {
        // Math is not possible to solve (divide by zero, etc).
        continue;
      }

      // Has this result already been processed (duplicate elimination).
      if (uniqueResults.has(result.sortableEquation)) {
        continue;
      }
      uniqueResults.add(result.sortableEquation);

      // Check if the result fits the board.
      const isOnBoard =
        Number.isInteger(result.total) &&
        result.total >= this.config.minTotal &&
        result.total <= this.config.maxTotal;
      if (!isOnBoard) {
        continue;
      }

      delete (result as any).isLeaf;
      results.push(result);
    }

    results.sort((a, b) => {
      if (a.sortableEquation < b.sortableEquation) {
        return -1;
      }

      if (a.sortableEquation > b.sortableEquation) {
        return 1;
      }

      return 0;
    });

    return results;
  }
}
