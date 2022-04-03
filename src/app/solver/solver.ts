/* eslint-disable max-classes-per-file */
/**
 * Tools for providing solutions to muggins dice.
 */
import { cartesianProduct } from 'cartesian-product-multiple-arrays';
import { uniqWith } from 'lodash';
import { Operation } from '../general_types';

interface ParingPermutation extends Array<any | ParingPermutation[]> {}

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

  toString(): string {
    if (this.stringCache === undefined) {
      this.stringCache = this.calculateToString();
    }

    return this.stringCache;
  }

  abstract calculateToString(): string;
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

    return this.operation.operationFunction(num1, num2);
  }

  calculateToString(): string {
    const num1 = this.num1.toString();
    const num2 = this.num2.toString();

    return `(${num1} ${this.operation.operator} ${num2})`;
  }

  static createFromPairingsAndOperations(
    pairings: ParingPermutation,
    operations: Operation[]
  ): Equation {
    return Equation.createFromPairingsAndOperationsInternal(
      pairings.slice(),
      operations.slice()
    );
  }

  private static createFromPairingsAndOperationsInternal(
    pairings: ParingPermutation,
    operations: Operation[]
  ): Equation {
    const operation = operations.pop();

    return new Equation(
      Equation.newNum(pairings[0], operations),
      Equation.newNum(pairings[1], operations),
      operation as Operation
    );
  }

  private static newNum(
    num: any[] | number,
    operations: Operation[]
  ): BaseEquation {
    if (Array.isArray(num)) {
      return Equation.createFromPairingsAndOperationsInternal(num, operations);
    }

    return new EquationNumber(num);
  }
}

export class MugginsSolver {
  private readonly maxTotal: number;

  private readonly minTotal: number;

  /**
   * Create a new solver.
   * @param minTotal Minimum board size.
   * @param maxTotal Maximum board size.
   */
  constructor(minTotal: number, maxTotal: number) {
    this.minTotal = minTotal;
    this.maxTotal = maxTotal;
  }

  private permutations(xs: number[]): number[][] {
    const ret = [];

    for (let i = 0; i < xs.length; i += 1) {
      const rest = this.permutations(xs.slice(0, i).concat(xs.slice(i + 1)));

      if (!rest.length) {
        ret.push([xs[i]]);
      } else {
        for (let j = 0; j < rest.length; j += 1) {
          ret.push([xs[i]].concat(rest[j]));
        }
      }
    }
    return ret;
  }

  private pairingPermutations(
    arr: ParingPermutation,
    depth = 0
  ): ParingPermutation {
    const permutations: ParingPermutation = [];

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
  public getEquations(
    selectedFaces: number[],
    selectedOperations: Operation[]
  ): EquationData[] {
    const facePermutations = uniqWith(
      this.permutations(selectedFaces),
      (a, b) => a.join('_') === b.join('_')
    ) as number[][];

    const operationPermutations = cartesianProduct(
      ...selectedFaces.slice(1).map(() => selectedOperations)
    );

    const facePairingPermutations = facePermutations.flatMap((f) =>
      this.pairingPermutations(f)
    );

    return cartesianProduct(facePairingPermutations, operationPermutations)
      .map((arr) =>
        Equation.createFromPairingsAndOperations(arr.slice(0, 2), arr[2])
      )
      .filter(
        (equation) =>
          Number.isInteger(equation.total()) &&
          equation.total() >= this.minTotal &&
          equation.total() <= this.maxTotal
      )
      .map((equation) => ({
        total: equation.total(),
        equation: equation.toString(),
      }));
  }
}

export interface EquationData {
  readonly total: number;
  readonly equation: string;
}
