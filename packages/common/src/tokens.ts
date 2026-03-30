/**
 * 5-bit token encoding for compact binary storage of equations.
 *
 * Token values (0-31):
 *   1-10:  Die face values
 *   11-24: Reserved for future use
 *   25:    Plus (+)
 *   26:    Minus (-)
 *   27:    Multiply (*)
 *   28:    Divide (/)
 *   29:    Power (^)
 *   30:    Root
 *   31:    Modulo (%)
 */

export enum OperationEnum {
  PLUS = 'plus',
  MINUS = 'minus',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
  POWER = 'power',
  ROOT = 'root',
  MODULO = 'modulo',
}

export const TOKEN_PLUS = 25;
export const TOKEN_MINUS = 26;
export const TOKEN_MULTIPLY = 27;
export const TOKEN_DIVIDE = 28;
export const TOKEN_POWER = 29;
export const TOKEN_ROOT = 30;
export const TOKEN_MODULO = 31;

export const MIN_FACE_VALUE = 1;
export const MAX_FACE_VALUE = 10;

/**
 * Database schema version. Increment when the DB schema changes
 * in a way that is incompatible with older app versions.
 */
export const DB_VERSION = 1;

/**
 * Bitmask values for each operation, used to encode which operations
 * appear in an equation as a single integer.
 */
export const OPERATION_MASKS: Record<OperationEnum, number> = {
  [OperationEnum.PLUS]: 1,
  [OperationEnum.MINUS]: 2,
  [OperationEnum.MULTIPLY]: 4,
  [OperationEnum.DIVIDE]: 8,
  [OperationEnum.POWER]: 16,
  [OperationEnum.ROOT]: 32,
  [OperationEnum.MODULO]: 64,
};

export const OPERATION_TO_TOKEN: Record<OperationEnum, number> = {
  [OperationEnum.PLUS]: TOKEN_PLUS,
  [OperationEnum.MINUS]: TOKEN_MINUS,
  [OperationEnum.MULTIPLY]: TOKEN_MULTIPLY,
  [OperationEnum.DIVIDE]: TOKEN_DIVIDE,
  [OperationEnum.POWER]: TOKEN_POWER,
  [OperationEnum.ROOT]: TOKEN_ROOT,
  [OperationEnum.MODULO]: TOKEN_MODULO,
};

/**
 * Returns true if the token represents an operation (25-31).
 */
export function isOperationToken(token: number): boolean {
  return token >= TOKEN_PLUS && token <= TOKEN_MODULO;
}

/**
 * Returns true if the token represents a face value (1-10).
 */
export function isFaceToken(token: number): boolean {
  return token >= MIN_FACE_VALUE && token <= MAX_FACE_VALUE;
}

/**
 * Pack an array of 5-bit tokens into a Uint8Array.
 * Each token must be in range 0-31.
 */
export function packTokens(tokens: number[]): Uint8Array {
  const totalBits = tokens.length * 5;
  const byteLength = Math.ceil(totalBits / 8);
  const result = new Uint8Array(byteLength);

  for (let i = 0; i < tokens.length; i++) {
    const bitOffset = i * 5;
    const byteIndex = Math.floor(bitOffset / 8);
    const bitIndex = bitOffset % 8;

    // Write into current byte
    result[byteIndex] |= (tokens[i] & 0x1f) << bitIndex;

    // If it crosses a byte boundary, write the overflow into the next byte
    if (bitIndex > 3) {
      result[byteIndex + 1] |= (tokens[i] & 0x1f) >> (8 - bitIndex);
    }
  }

  return result;
}

/**
 * Unpack 5-bit tokens from a Uint8Array.
 * @param data The packed binary data
 * @param tokenCount Number of tokens to extract
 */
export function unpackTokens(data: Uint8Array, tokenCount: number): number[] {
  const tokens: number[] = new Array(tokenCount);

  for (let i = 0; i < tokenCount; i++) {
    const bitOffset = i * 5;
    const byteIndex = Math.floor(bitOffset / 8);
    const bitIndex = bitOffset % 8;

    let value = (data[byteIndex] >> bitIndex) & 0x1f;

    // If it crosses a byte boundary, read from the next byte
    if (bitIndex > 3) {
      value |= (data[byteIndex + 1] << (8 - bitIndex)) & 0x1f;
    }

    tokens[i] = value;
  }

  return tokens;
}

/**
 * Calculate the packed byte length for a given number of tokens.
 */
export function packedByteLength(tokenCount: number): number {
  return Math.ceil((tokenCount * 5) / 8);
}

/**
 * Convert an array of OperationEnum values to a bitmask using OPERATION_MASKS.
 */
export function operationsToMask(operations: OperationEnum[]): number {
  return operations.reduce((mask, op) => mask | (OPERATION_MASKS[op] ?? 0), 0);
}
