import { describe, it, expect } from 'vitest';
import {
  EQUATION_FORMATTER,
  OPERATIONS,
  OPERATIONS_LIST,
  getSortableEquation,
  calculateFromFaceAndOperationPermutations,
  commonWorkerFunctions,
  combineResults,
  CalculateEquationResult,
  generateFaceCombinations,
  generateResults,
} from './solver-common.js';
import { OperationEnum } from './tokens.js';

describe('EQUATION_FORMATTER', () => {
  it('formats total and equation', () => {
    expect(EQUATION_FORMATTER(8, '6 + 2')).toBe('8 = 6 + 2');
  });

  it('formats with string total', () => {
    expect(EQUATION_FORMATTER('0008', '6 + 2')).toBe('0008 = 6 + 2');
  });
});

describe('OPERATIONS', () => {
  it('has 7 operations', () => {
    expect(OPERATIONS_LIST).toHaveLength(7);
  });

  it('Plus: solve, display, displayGroup, isCommutative', () => {
    const op = OPERATIONS[OperationEnum.PLUS];
    expect(op.name).toBe('Plus');
    expect(op.solve(6, 2)).toBe(8);
    expect(op.display(6, 2)).toBe('6 + 2');
    expect(op.displayGroup('x')).toBe('(x)');
    expect(op.isCommutative).toBe(true);
  });

  it('Minus: solve, display, displayGroup, isCommutative', () => {
    const op = OPERATIONS[OperationEnum.MINUS];
    expect(op.name).toBe('Minus');
    expect(op.solve(6, 2)).toBe(4);
    expect(op.display(6, 2)).toBe('6 - 2');
    expect(op.displayGroup('x')).toBe('(x)');
    expect(op.isCommutative).toBe(false);
  });

  it('Multiply: solve, display, displayGroup, isCommutative', () => {
    const op = OPERATIONS[OperationEnum.MULTIPLY];
    expect(op.name).toBe('Multiply');
    expect(op.solve(6, 2)).toBe(12);
    expect(op.display(6, 2)).toBe('6 * 2');
    expect(op.displayGroup('x')).toBe('(x)');
    expect(op.isCommutative).toBe(true);
  });

  it('Divide: solve, display, displayGroup, isCommutative', () => {
    const op = OPERATIONS[OperationEnum.DIVIDE];
    expect(op.name).toBe('Divide');
    expect(op.solve(6, 2)).toBe(3);
    expect(op.display(6, 2)).toBe('6 / 2');
    expect(op.displayGroup('x')).toBe('(x)');
    expect(op.isCommutative).toBe(false);
  });

  it('Power: solve, display, displayGroup, isCommutative', () => {
    const op = OPERATIONS[OperationEnum.POWER];
    expect(op.name).toBe('Power');
    expect(op.solve(5, 2)).toBe(25);
    expect(op.display(5, 2)).toBe('5 ^ 2');
    expect(op.displayGroup('x')).toBe('x');
    expect(op.isCommutative).toBe(false);
  });

  it('Root: solve, display, displayGroup, isCommutative', () => {
    const op = OPERATIONS[OperationEnum.ROOT];
    expect(op.name).toBe('Root');
    expect(op.solve(27, 3)).toBe(3);
    expect(op.display(27, 3)).toBe('root(27)(3)');
    expect(op.displayGroup('x')).toBe('x');
    expect(op.isCommutative).toBe(false);
  });

  it('Modulo: solve, display, displayGroup, isCommutative', () => {
    const op = OPERATIONS[OperationEnum.MODULO];
    expect(op.name).toBe('Modulo');
    expect(op.solve(5, 3)).toBe(2);
    expect(op.display(5, 3)).toBe('5 % 3');
    expect(op.displayGroup('x')).toBe('(x)');
    expect(op.isCommutative).toBe(false);
  });
});

describe('OPERATIONS record', () => {
  it('maps all operation enum values', () => {
    const allEnums = [
      OperationEnum.PLUS, OperationEnum.MINUS, OperationEnum.MULTIPLY,
      OperationEnum.DIVIDE, OperationEnum.POWER, OperationEnum.ROOT,
      OperationEnum.MODULO,
    ];
    for (const id of allEnums) {
      expect(OPERATIONS[id]).toBeDefined();
      expect(OPERATIONS[id].id).toBe(id);
    }
  });
});

describe('getSortableEquation', () => {
  it('replaces parentheses and equals sign', () => {
    const result = getSortableEquation('(1 + 2) = 3');
    expect(result).toBe('X1 + 2Y Z 3');
  });

  it('handles equation with no special chars', () => {
    expect(getSortableEquation('1 + 2')).toBe('1 + 2');
  });

  it('replaces multiple parentheses', () => {
    const result = getSortableEquation('((1 + 2) * 3)');
    expect(result).toBe('XX1 + 2Y * 3Y');
  });
});

describe('commonWorkerFunctions', () => {
  describe('combineResults', () => {
    it('combines and deduplicates multiple result arrays', () => {
      const arr1: CalculateEquationResult[] = [
        { total: 1, equation: '1', fullEquation: '1 = 1', sortableEquation: 'a', postfixTokens: [] },
        { total: 3, equation: '3', fullEquation: '3 = 3', sortableEquation: 'c', postfixTokens: [] },
      ];
      const arr2: CalculateEquationResult[] = [
        { total: 2, equation: '2', fullEquation: '2 = 2', sortableEquation: 'b', postfixTokens: [] },
        { total: 3, equation: '3', fullEquation: '3 = 3', sortableEquation: 'c', postfixTokens: [] },
      ];
      const combined = commonWorkerFunctions.combineResults([arr1, arr2]);
      expect(combined.map(r => r.sortableEquation)).toEqual(['a', 'b', 'c']);
    });

    it('handles empty input', () => {
      expect(commonWorkerFunctions.combineResults([])).toEqual([]);
    });

    it('is also exported as a standalone function', () => {
      expect(combineResults).toBe(commonWorkerFunctions.combineResults);
    });
  });

  describe('getFaceAndOperationPermutations', () => {
    it('returns both face and operation permutations', () => {
      const config = {
        minTotal: 1, maxTotal: 36,
        faces: [1, 2],
        operations: [OperationEnum.PLUS],
      };
      const result = commonWorkerFunctions.getFaceAndOperationPermutations(config);
      expect(result.facePermutations.length).toBeGreaterThan(0);
      expect(result.operationPermutations.length).toBeGreaterThan(0);
    });
  });

});

describe('calculateFromFaceAndOperationPermutations', () => {
  it('calculates equations from known inputs', () => {
    const config = {
      minTotal: 1, maxTotal: 36,
      faces: [2, 3],
      operations: [OperationEnum.PLUS],
    };
    const { facePermutations, operationPermutations } =
      commonWorkerFunctions.getFaceAndOperationPermutations(config);

    const results = calculateFromFaceAndOperationPermutations(
      config, facePermutations, operationPermutations
    );

    // 2 + 3 = 5, should appear in results
    expect(results.some(r => r.total === 5)).toBe(true);
  });

  it('filters results outside min/max range', () => {
    const config = {
      minTotal: 10, maxTotal: 20,
      faces: [1, 2],
      operations: [OperationEnum.PLUS],
    };
    const { facePermutations, operationPermutations } =
      commonWorkerFunctions.getFaceAndOperationPermutations(config);

    const results = calculateFromFaceAndOperationPermutations(
      config, facePermutations, operationPermutations
    );

    // 1 + 2 = 3, outside range
    expect(results).toHaveLength(0);
  });

  it('filters non-integer results', () => {
    const config = {
      minTotal: 1, maxTotal: 36,
      faces: [1, 3],
      operations: [OperationEnum.DIVIDE],
    };
    const { facePermutations, operationPermutations } =
      commonWorkerFunctions.getFaceAndOperationPermutations(config);

    const results = calculateFromFaceAndOperationPermutations(
      config, facePermutations, operationPermutations
    );

    // 1/3 = 0.333... is not integer, 3/1 = 3 is integer
    for (const r of results) {
      expect(Number.isInteger(r.total)).toBe(true);
    }
  });

  it('handles non-finite results from divide by zero (3 faces)', () => {
    // faces [1,1,1] with [MINUS,DIVIDE] produces 1 / (1-1) = Infinity
    // which exercises the non-finite throw (line 254) and catch block (line 640)
    const config = {
      minTotal: 0, maxTotal: 100,
      faces: [1, 1, 1],
      operations: [OperationEnum.MINUS, OperationEnum.DIVIDE],
    };
    const { facePermutations, operationPermutations } =
      commonWorkerFunctions.getFaceAndOperationPermutations(config);

    // Should not throw - non-finite results are caught and filtered
    const results = calculateFromFaceAndOperationPermutations(
      config, facePermutations, operationPermutations
    );

    for (const r of results) {
      expect(Number.isFinite(r.total)).toBe(true);
    }
  });

  it('produces correct fullEquation and sortableEquation', () => {
    const config = {
      minTotal: 1, maxTotal: 36,
      faces: [2, 3],
      operations: [OperationEnum.PLUS],
    };
    const { facePermutations, operationPermutations } =
      commonWorkerFunctions.getFaceAndOperationPermutations(config);

    const results = calculateFromFaceAndOperationPermutations(
      config, facePermutations, operationPermutations
    );

    const r5 = results.find(r => r.total === 5);
    expect(r5).toBeDefined();
    expect(r5!.fullEquation).toContain('5 =');
    expect(r5!.sortableEquation).toBeDefined();
  });

  it('deduplicates results with same sortableEquation', () => {
    const config = {
      minTotal: 1, maxTotal: 36,
      faces: [2, 3],
      operations: [OperationEnum.PLUS],
    };
    const { facePermutations, operationPermutations } =
      commonWorkerFunctions.getFaceAndOperationPermutations(config);

    const results = calculateFromFaceAndOperationPermutations(
      config, facePermutations, operationPermutations
    );

    const sortableEquations = results.map(r => r.sortableEquation);
    const uniqueSet = new Set(sortableEquations);
    expect(sortableEquations.length).toBe(uniqueSet.size);
  });
});

describe('generateFaceCombinations', () => {
  it('generates correct count for 2d6 (C(7,2) = 21)', () => {
    const combos = generateFaceCombinations(2, 6);
    expect(combos).toHaveLength(21);
  });

  it('generates correct count for 3d6 (C(8,3) = 56)', () => {
    const combos = generateFaceCombinations(3, 6);
    expect(combos).toHaveLength(56);
  });

  it('generates correct count for 2d3 (C(4,2) = 6)', () => {
    const combos = generateFaceCombinations(2, 3);
    expect(combos).toHaveLength(6);
  });

  it('each combination is sorted ascending', () => {
    const combos = generateFaceCombinations(3, 6);
    for (const combo of combos) {
      for (let i = 1; i < combo.length; i++) {
        expect(combo[i]).toBeGreaterThanOrEqual(combo[i - 1]);
      }
    }
  });

  it('each combination has the correct length', () => {
    const combos = generateFaceCombinations(4, 4);
    for (const combo of combos) {
      expect(combo).toHaveLength(4);
    }
  });

  it('all values are within range [1, maxFaceValue]', () => {
    const combos = generateFaceCombinations(3, 6);
    for (const combo of combos) {
      for (const value of combo) {
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(6);
      }
    }
  });

  it('produces no duplicate combinations', () => {
    const combos = generateFaceCombinations(3, 6);
    const keys = combos.map(c => c.join('_'));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('handles single die', () => {
    const combos = generateFaceCombinations(1, 6);
    expect(combos).toHaveLength(6);
    expect(combos).toEqual([[1], [2], [3], [4], [5], [6]]);
  });
});

describe('generateResults', () => {
  it('yields results with total and postfixTokens', () => {
    const results = [...generateResults({
      minTotal: 0, maxTotal: 72,
      faces: [1, 2],
      operations: [OperationEnum.PLUS, OperationEnum.MINUS],
    })];

    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(typeof r.total).toBe('number');
      expect(Array.isArray(r.postfixTokens)).toBe(true);
      expect(r.postfixTokens.length).toBeGreaterThan(0);
    }
  });

  it('yields deduplicated results', () => {
    const results = [...generateResults({
      minTotal: 0, maxTotal: 72,
      faces: [1, 2, 3],
      operations: [OperationEnum.PLUS, OperationEnum.MINUS],
    })];

    const keys = results.map(r => r.postfixTokens.join(','));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('results match calculateFromFaceAndOperationPermutations output', () => {
    const config = {
      minTotal: 0, maxTotal: 72,
      faces: [1, 2],
      operations: [OperationEnum.PLUS, OperationEnum.MINUS],
    };

    const generatorResults = [...generateResults(config)];
    const { facePermutations, operationPermutations } =
      commonWorkerFunctions.getFaceAndOperationPermutations(config);
    const directResults = calculateFromFaceAndOperationPermutations(
      config, facePermutations, operationPermutations
    );

    // Same number of unique equations
    expect(generatorResults.length).toBe(directResults.length);

    // Every direct result should have a matching generator result
    const generatorKeys = new Set(generatorResults.map(r => r.postfixTokens.join(',')));
    for (const r of directResults) {
      expect(generatorKeys.has(r.postfixTokens.join(','))).toBe(true);
    }
  });

  it('handles non-finite results gracefully (catch branch)', () => {
    // faces [1,1,1] with MINUS and DIVIDE produces 1/(1-1)=Infinity which throws
    const results = [...generateResults({
      minTotal: 0, maxTotal: 72,
      faces: [1, 1, 1],
      operations: [OperationEnum.MINUS, OperationEnum.DIVIDE],
    })];

    // Should not throw, non-finite results are caught and skipped
    for (const r of results) {
      expect(Number.isFinite(r.total)).toBe(true);
    }
  });

  it('respects minTotal and maxTotal', () => {
    const results = [...generateResults({
      minTotal: 3, maxTotal: 5,
      faces: [1, 2, 3],
      operations: [OperationEnum.PLUS],
    })];

    for (const r of results) {
      expect(r.total).toBeGreaterThanOrEqual(3);
      expect(r.total).toBeLessThanOrEqual(5);
    }
  });

  it('accepts explicit permutations for chunked dispatch', () => {
    const config = {
      minTotal: 0, maxTotal: 72,
      faces: [1, 2],
      operations: [OperationEnum.PLUS],
    };
    const { facePermutations, operationPermutations } =
      commonWorkerFunctions.getFaceAndOperationPermutations(config);

    const results = [...generateResults(config, facePermutations, operationPermutations)];
    const directResults = [...generateResults(config)];

    expect(results.length).toBe(directResults.length);
  });

  it('is lazy — yields one at a time', () => {
    const gen = generateResults({
      minTotal: 0, maxTotal: 72,
      faces: [1, 2],
      operations: [OperationEnum.PLUS],
    });

    const first = gen.next();
    expect(first.done).toBe(false);
    expect(first.value).toBeDefined();
    expect(typeof first.value!.total).toBe('number');
  });
});
