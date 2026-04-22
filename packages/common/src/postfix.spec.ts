import { describe, it, expect } from 'vitest';
import { postfixToInfix, postfixToInfixGrouped } from './postfix.js';
import {
  TOKEN_PLUS,
  TOKEN_MINUS,
  TOKEN_MULTIPLY,
  TOKEN_DIVIDE,
  TOKEN_POWER,
  TOKEN_ROOT,
  TOKEN_MODULO,
} from './tokens.js';

describe('postfixToInfix', () => {
  it('converts simple addition', () => {
    expect(postfixToInfix([1, 2, TOKEN_PLUS])).toBe('1 + 2');
  });

  it('converts simple subtraction', () => {
    expect(postfixToInfix([5, 3, TOKEN_MINUS])).toBe('5 - 3');
  });

  it('converts nested expressions', () => {
    // (1 + 2) * 3 in postfix: 1 2 + 3 *
    expect(postfixToInfix([1, 2, TOKEN_PLUS, 3, TOKEN_MULTIPLY])).toBe(
      '1 + 2 * 3'
    );
  });

  it('converts power', () => {
    expect(postfixToInfix([2, 3, TOKEN_POWER])).toBe('2 ^ 3');
  });

  it('converts root', () => {
    expect(postfixToInfix([8, 3, TOKEN_ROOT])).toBe('root(8)(3)');
  });

  it('converts modulo', () => {
    expect(postfixToInfix([5, 3, TOKEN_MODULO])).toBe('5 % 3');
  });
});

describe('postfixToInfixGrouped', () => {
  it('converts simple addition without grouping', () => {
    expect(postfixToInfixGrouped([1, 2, TOKEN_PLUS])).toBe('1 + 2');
  });

  it('adds parentheses for sub-expressions', () => {
    // (1 + 2) * 3 in postfix: 1 2 + 3 *
    expect(postfixToInfixGrouped([1, 2, TOKEN_PLUS, 3, TOKEN_MULTIPLY])).toBe(
      '(1 + 2) * 3'
    );
  });

  it('adds parentheses for nested sub-expressions', () => {
    // ((1 + 2) * 3) - 4 in postfix: 1 2 + 3 * 4 -
    // The multiply sub-expression gets wrapped by its displayGroup (GROUPING_PARENTHESIS)
    expect(
      postfixToInfixGrouped([
        1,
        2,
        TOKEN_PLUS,
        3,
        TOKEN_MULTIPLY,
        4,
        TOKEN_MINUS,
      ])
    ).toBe('((1 + 2) * 3) - 4');
  });

  it('does not wrap root-level power', () => {
    expect(postfixToInfixGrouped([2, 3, TOKEN_POWER])).toBe('2 ^ 3');
  });

  it('does not wrap sub-expression power (displayGroup is GROUPING_NONE for power)', () => {
    // 2 ^ 3 + 4 in postfix: 2 3 ^ 4 +
    expect(postfixToInfixGrouped([2, 3, TOKEN_POWER, 4, TOKEN_PLUS])).toBe(
      '2 ^ 3 + 4'
    );
  });

  it('handles right-nested expressions', () => {
    // 1 + (2 * 3) in postfix: 1 2 3 * +
    expect(postfixToInfixGrouped([1, 2, 3, TOKEN_MULTIPLY, TOKEN_PLUS])).toBe(
      '1 + (2 * 3)'
    );
  });

  it('returns a single value for a single-token expression', () => {
    // A single face value with no operators — lastOpIndex stays -1
    expect(postfixToInfixGrouped([5])).toBe('5');
  });

  it('handles 4-dice expression', () => {
    // ((1 + 2) * 3) - 4 in postfix: 1 2 + 3 * 4 -
    const tokens = [1, 2, TOKEN_PLUS, 3, TOKEN_MULTIPLY, 4, TOKEN_MINUS];
    const result = postfixToInfixGrouped(tokens);
    expect(result).toBe('((1 + 2) * 3) - 4');
  });
});
