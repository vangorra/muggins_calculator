import { describe, it, expect } from 'vitest';
import {
  packTokens,
  unpackTokens,
  packedByteLength,
  isOperationToken,
  isFaceToken,
  operationsToMask,
  OperationEnum,
  OPERATION_MASKS,
  TOKEN_PLUS,
  TOKEN_MINUS,
  TOKEN_MULTIPLY,
  TOKEN_DIVIDE,
  TOKEN_POWER,
  TOKEN_ROOT,
  TOKEN_MODULO,
} from './tokens.js';

describe('packTokens and unpackTokens', () => {
  it('round-trips a simple array', () => {
    const tokens = [1, 2, 25]; // 1, 2, plus
    const packed = packTokens(tokens);
    const unpacked = unpackTokens(packed, tokens.length);
    expect(unpacked).toEqual(tokens);
  });

  it('round-trips all face values', () => {
    const tokens = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const packed = packTokens(tokens);
    const unpacked = unpackTokens(packed, tokens.length);
    expect(unpacked).toEqual(tokens);
  });

  it('round-trips all operation tokens', () => {
    const tokens = [
      TOKEN_PLUS,
      TOKEN_MINUS,
      TOKEN_MULTIPLY,
      TOKEN_DIVIDE,
      TOKEN_POWER,
      TOKEN_ROOT,
      TOKEN_MODULO,
    ];
    const packed = packTokens(tokens);
    const unpacked = unpackTokens(packed, tokens.length);
    expect(unpacked).toEqual(tokens);
  });

  it('round-trips a 3-dice postfix equation', () => {
    // (1 + 2) * 3 in postfix: 1 2 + 3 *
    const tokens = [1, 2, TOKEN_PLUS, 3, TOKEN_MULTIPLY];
    const packed = packTokens(tokens);
    expect(packed.length).toBe(packedByteLength(5)); // ceil(25/8) = 4
    const unpacked = unpackTokens(packed, tokens.length);
    expect(unpacked).toEqual(tokens);
  });

  it('round-trips a 6-dice postfix equation', () => {
    // 11 tokens for 6 dice
    const tokens = [
      1,
      2,
      TOKEN_PLUS,
      3,
      TOKEN_MULTIPLY,
      4,
      TOKEN_MINUS,
      5,
      TOKEN_DIVIDE,
      6,
      TOKEN_POWER,
    ];
    const packed = packTokens(tokens);
    expect(packed.length).toBe(packedByteLength(11)); // ceil(55/8) = 7
    const unpacked = unpackTokens(packed, tokens.length);
    expect(unpacked).toEqual(tokens);
  });

  it('handles max token value (31)', () => {
    const tokens = [31, 31, 31];
    const packed = packTokens(tokens);
    const unpacked = unpackTokens(packed, tokens.length);
    expect(unpacked).toEqual(tokens);
  });

  it('handles single token', () => {
    const tokens = [5];
    const packed = packTokens(tokens);
    expect(packed.length).toBe(1);
    const unpacked = unpackTokens(packed, 1);
    expect(unpacked).toEqual(tokens);
  });
});

describe('packedByteLength', () => {
  it('calculates correct byte lengths', () => {
    expect(packedByteLength(1)).toBe(1); // 5 bits
    expect(packedByteLength(3)).toBe(2); // 15 bits
    expect(packedByteLength(5)).toBe(4); // 25 bits (3 dice)
    expect(packedByteLength(7)).toBe(5); // 35 bits (4 dice)
    expect(packedByteLength(9)).toBe(6); // 45 bits (5 dice)
    expect(packedByteLength(11)).toBe(7); // 55 bits (6 dice)
  });
});

describe('isOperationToken', () => {
  it('returns true for operation tokens', () => {
    expect(isOperationToken(TOKEN_PLUS)).toBe(true);
    expect(isOperationToken(TOKEN_MODULO)).toBe(true);
  });

  it('returns false for face tokens', () => {
    expect(isOperationToken(1)).toBe(false);
    expect(isOperationToken(10)).toBe(false);
  });
});

describe('isFaceToken', () => {
  it('returns true for face tokens', () => {
    expect(isFaceToken(1)).toBe(true);
    expect(isFaceToken(10)).toBe(true);
  });

  it('returns false for operation tokens', () => {
    expect(isFaceToken(TOKEN_PLUS)).toBe(false);
  });

  it('returns false for zero', () => {
    expect(isFaceToken(0)).toBe(false);
  });
});

describe('operationsToMask', () => {
  it('returns 0 for empty array', () => {
    expect(operationsToMask([])).toBe(0);
  });

  it('returns correct mask for a single operation', () => {
    expect(operationsToMask([OperationEnum.PLUS])).toBe(
      OPERATION_MASKS[OperationEnum.PLUS]
    );
    expect(operationsToMask([OperationEnum.MODULO])).toBe(
      OPERATION_MASKS[OperationEnum.MODULO]
    );
  });

  it('returns combined mask for multiple operations', () => {
    const mask = operationsToMask([
      OperationEnum.PLUS,
      OperationEnum.MINUS,
      OperationEnum.MULTIPLY,
    ]);
    expect(mask).toBe(
      OPERATION_MASKS[OperationEnum.PLUS] |
        OPERATION_MASKS[OperationEnum.MINUS] |
        OPERATION_MASKS[OperationEnum.MULTIPLY]
    );
  });

  it('returns full mask for all operations', () => {
    const allOps = Object.values(OperationEnum);
    const mask = operationsToMask(allOps);
    const expectedMask = allOps.reduce((m, op) => m | OPERATION_MASKS[op], 0);
    expect(mask).toBe(expectedMask);
    expect(mask).toBe(127); // 1+2+4+8+16+32+64
  });

  it('returns 0 for unknown operation (nullish coalescing fallback)', () => {
    // Force an unknown operation value to exercise the ?? 0 fallback branch
    const mask = operationsToMask(['unknown_op' as OperationEnum]);
    expect(mask).toBe(0);
  });
});
