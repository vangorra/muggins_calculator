/* eslint-disable max-classes-per-file */
/**
 * Tools for providing solutions to muggins dice.
 */
import { isNumber, sortBy, sortedUniqBy, uniqWith } from 'lodash';

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
}

export const EQUATION_FORMATTER = (total: number, equation: string) =>
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

const cartesianProduct = (...a: any[]): any[][] =>
  a.reduce((t: any[], b) => t.flatMap((d) => b.map((e: any) => [d, e].flat())));

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

abstract class BaseEquation {
  private totalCache: number | undefined = undefined;

  private stringCache: string | undefined = undefined;

  public total(): number {
    if (this.totalCache === undefined) {
      this.totalCache = this.calculateTotal();
    }

    return this.totalCache;
  }

  abstract calculateTotal(): number;

  toString(withGrouping = true): string {
    if (this.stringCache === undefined) {
      this.stringCache = this.calculateToString(withGrouping);
    }

    return this.stringCache;
  }

  abstract calculateToString(withGrouping: boolean): string;
}

class EquationNumber extends BaseEquation {
  constructor(private readonly num: number) {
    super();
  }

  calculateTotal(): number {
    return this.num;
  }

  calculateToString(): string {
    return `${this.num}`;
  }
}

class Equation extends BaseEquation {
  constructor(
    private readonly left: BaseEquation,
    private readonly right: BaseEquation,
    private readonly operation: Operation
  ) {
    super();
  }

  calculateTotal(): number {
    const num1 = +this.left.total();
    const num2 = +this.right.total();

    return this.operation.solve(num1, num2);
  }

  calculateToString(withGrouping = true): string {
    const left = this.left.toString();
    const right = this.right.toString();

    const display = this.operation.display(left, right);
    if (!withGrouping) {
      return display;
    }
    return this.operation.displayGroup(display);
  }

  static createFromPairingsAndOperations(
    pairings: PairingPermutation,
    operations: Operation[]
  ): Equation {
    return Equation.createFromPairingsAndOperationsInternal(
      pairings.slice(),
      operations.slice()
    );
  }

  private static createFromPairingsAndOperationsInternal(
    pairings: PairingPermutation,
    operations: Operation[]
  ): Equation {
    const operation = operations.pop() as Operation;
    let pairing0 = pairings[0];
    let pairing1 = pairings[1];

    // For operation where order does not matter, configure the equation member order
    // to make it easy to find and filter out duplicate equations. So duplicate equations like
    // "4 + (3 - 2) = 5" and "(3 - 2) + 4 = 5" would instead become "4 + (3 - 2)" and equations like
    // "4 + 3 = 7" and "3 + 4 = 7" become "3 + 4 = 7".
    if (operation.isCommutative) {
      const shouldSwap =
        (isNumber(pairing0) && isNumber(pairing1) && pairing1 < pairing0) ||
        (!isNumber(pairing0) && isNumber(pairing1));

      if (shouldSwap) {
        const tmp = pairing0;
        pairing0 = pairing1;
        pairing1 = tmp;
      }
    }

    return new Equation(
      Equation.newNum(pairing0, operations),
      Equation.newNum(pairing1, operations),
      operation
    );
  }

  private static newNum(
    num: PairingPermutation | number,
    operations: Operation[]
  ): BaseEquation {
    if (Array.isArray(num)) {
      return Equation.createFromPairingsAndOperationsInternal(num, operations);
    }

    return new EquationNumber(num);
  }
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
   * @param selectedFaces
   * @param selectedOperations
   */
  public calculateSolutions(): CalculateResult[] {
    if (this.config.faces.length < 2 || this.config.operations.length === 0) {
      return [];
    }

    const facePermutations = uniqWith(
      MugginsSolver.permutations(this.config.faces),
      (a, b) => a.join('_') === b.join('_')
    ) as number[][];

    const operationPermutations = cartesianProduct(
      ...this.config.faces.slice(1).map(() => this.config.operations)
    );

    const facePairingPermutations = facePermutations.flatMap((f) =>
      this.pairingPermutations(f)
    );

    const equations = cartesianProduct(
      facePairingPermutations,
      operationPermutations
    )
      .map((item) => {
        const pairing1 = item.slice(0, 1);
        const pairing2 = item.slice(1, 2);

        return [
          pairing1.length > 1 ? pairing1 : pairing1[0],
          pairing2.length > 1 ? pairing2 : pairing2[0],
          item.slice(2, item.length),
        ];
      })
      .map(([pairing1, pairing2, operations]) =>
        Equation.createFromPairingsAndOperations(
          [pairing1, pairing2],
          operations
        )
      )
      .filter(
        (equation) =>
          Number.isInteger(equation.total()) &&
          equation.total() >= this.config.minTotal &&
          equation.total() <= this.config.maxTotal
      )
      .map((equation) => {
        const total = equation.total();
        const equationStr = equation.toString(false);
        const fullEquation = EQUATION_FORMATTER(total, equationStr);
        return {
          total,
          fullEquation,
          equation: equationStr,
          sortableEquation: getSortableEquation(fullEquation),
        };
      });

    return sortedUniqBy(
      sortBy(equations, (equation) => equation.sortableEquation),
      (equation) => equation.sortableEquation
    );
  }
}
