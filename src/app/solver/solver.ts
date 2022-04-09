/* eslint-disable max-classes-per-file */
/**
 * Tools for providing solutions to muggins dice.
 */
import { cartesianProduct } from 'cartesian-product-multiple-arrays';
import {isNumber, uniqWith} from 'lodash';

type PairingPermutation = Array<number | PairingPermutation | PairingPermutation[]>;

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
  private readonly num: number;

  constructor(num: number) {
    super();
    this.num = num;
  }

  calculateTotal(): number {
    return this.num;
  }

  calculateToString(): string {
    return `${this.num}`;
  }
}

class Equation extends BaseEquation {
  private readonly num1: BaseEquation;

  private readonly num2: BaseEquation;

  private operation: Operation;

  constructor(num1: BaseEquation, num2: BaseEquation, operation: Operation) {
    super();
    this.num1 = num1;
    this.num2 = num2;
    this.operation = operation;
  }

  calculateTotal(): number {
    const num1 = +this.num1.total();
    const num2 = +this.num2.total();

    return this.operation.solve(num1, num2);
  }

  calculateToString(withGrouping = true): string {
    const num1 = this.num1.toString();
    const num2 = this.num2.toString();

    const display = this.operation.display(num1, num2);
    if (!withGrouping) {
      return display;
    }
    return this.operation.grouping(display);
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
    if (!operation.orderMatters) {
      const shouldSwap =
        (isNumber(pairing0) && isNumber(pairing1) && pairing1 < pairing0)
      || isNumber(pairing1);

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
  private readonly config: MugginsSolverConfig;

  // private readonly maxTotal: number;
  //
  // private readonly minTotal: number;

  /**
   * Create a new solver.
   * @param minTotal Minimum board size.
   * @param maxTotal Maximum board size.
   */
  // constructor(minTotal: number, maxTotal: number) {
  //   this.minTotal = minTotal;
  //   this.maxTotal = maxTotal;
  // }
  constructor(config: MugginsSolverConfig) {
    this.config = config;
  }

  private static permutations<T>(items: T[]): T[][] {
    const ret: T[][] = [];

    for (let i = 0; i < items.length; i += 1) {
      const rest = MugginsSolver.permutations(items.slice(0, i).concat(items.slice(i + 1)));

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
    const permutations: PairingPermutation = [];

    // Not enough items to pair.
    if (arr.length < 3) {
      return [arr];
    }

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

    const equations = cartesianProduct(facePairingPermutations, operationPermutations)
      .map(([pairing1, pairing2, operations]) =>
        Equation.createFromPairingsAndOperations([pairing1, pairing2], operations)
      )
      .filter(
        (equation) =>
          Number.isInteger(equation.total()) &&
          equation.total() >= this.config.minTotal &&
          equation.total() <= this.config.maxTotal
      )
      .map((equation) => ({
        total: equation.total(),
        equation: equation.toString(false),
      }));

    return uniqWith(equations, (a, b) => a.equation === b.equation);
  }
}

export enum OperationEnum {
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
  readonly solve: (a: number, b: number) => number;
  readonly display: (a: string, b: string) => string;
  readonly grouping: (text: string) => string;
  readonly orderMatters: boolean;
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
}

const GROUPING_PARENTHESIS = (text: string) => `(${text})`;
const GROUPING_NONE = (text: string) => text;

export const OPERATIONS: Operation[] = [
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
