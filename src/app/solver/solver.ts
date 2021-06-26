/**
 * Tools for providing solutions to muggins dice.
 */
import {cartesianProduct} from 'cartesian-product-multiple-arrays';
import {Operation} from "../const";
import {uniqWith} from "lodash";

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
  num: number;

  constructor(num: number) {
    super();
    this.num = num;
  }

  calculateTotal(): number {
    return this.num;
  }

  calculateToString(): string {
    return this.num + '';
  }
}

export class Equation extends BaseEquation {
  num1: BaseEquation;
  num2: BaseEquation;
  operation: Operation;

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

  static createFromPairingsAndOperations(pairings: ParingPermutation, operations: Operation[]): Equation {
    return Equation._createFromPairingsAndOperations(
      pairings.slice(),
      operations.slice()
    );
  }

  static _createFromPairingsAndOperations(pairings: ParingPermutation, operations: Operation[]): Equation {
    const operation = operations.pop();

    return new Equation(
      Equation._newNum(pairings[0], operations),
      Equation._newNum(pairings[1], operations),
      operation as Operation
    );
  }

  static _newNum(num: any[] | number, operations: Operation[]): BaseEquation {
    if (Array.isArray(num)) {
      return Equation._createFromPairingsAndOperations(num, operations)
    } else {
      return new EquationNumber(num);
    }
  }
}

export class MugginsSolver {
  maxTotal: number;
  minTotal: number;

  constructor(minTotal: number, maxTotal: number) {
    this.minTotal = minTotal;
    this.maxTotal = maxTotal;
  }

  private permutations(xs: number[]): number[][] {
    let ret = [];

    for (let i = 0; i < xs.length; i = i + 1) {
      let rest = this.permutations(xs.slice(0, i).concat(xs.slice(i + 1)));

      if(!rest.length) {
        ret.push([xs[i]])
      } else {
        for(let j = 0; j < rest.length; j = j + 1) {
          ret.push([xs[i]].concat(rest[j]))
        }
      }
    }
    return ret;
  }

  private pairingPermutations(arr: ParingPermutation, depth= 0): ParingPermutation {
    console.log('pairingPermutations', arr, 'depth', depth);
    const permutations: ParingPermutation = [];

    // Not enough items to pair.
    if (arr.length < 3) {
      return [arr];
    }

    for (var i = 0; i < arr.length - 1; i += 1) {
      const permutation = arr.slice();
      const pair = permutation.slice(i, i + 2)
      permutation.splice(i, 2, pair)

      this.pairingPermutations(permutation, depth + 1)
        .forEach(p => permutations.push(p));
    }

    return permutations;
  }

  public getEquations(selectedFaces: number[], selectedOperations: Operation[]): Equation[] {
    console.debug('getEquations', selectedFaces, selectedOperations);

    const facePermutations = uniqWith(
      this.permutations(selectedFaces),
      (a,b) => a.join('_') === b.join('_')
    ) as number[][];
    console.debug('facePermutations', facePermutations);

    const operationPermutations = cartesianProduct(...selectedFaces.slice(1).map(face => selectedOperations));
    console.debug('operationPermutations', operationPermutations);

    const facePairingPermutations = facePermutations
      .flatMap(f => this.pairingPermutations(f));
    console.debug('facePairingPermutations', facePairingPermutations);

    const equations = cartesianProduct(facePairingPermutations, operationPermutations)
      .map(arr => Equation.createFromPairingsAndOperations(
          arr.slice(0, 2),
          arr[2],
      ))
      .filter(equation => Number.isInteger(equation.total())
          && equation.total() >= this.minTotal
          && equation.total() <= this.maxTotal
      );
    console.debug('equations', equations);

    return equations;
  }
}
