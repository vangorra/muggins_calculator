/**
 * Postfix (Reverse Polish Notation) utilities for equation encoding/decoding.
 */

import { OPERATIONS, Operation } from './solver-common.js';
import { isOperationToken, OPERATION_TO_TOKEN, OperationEnum } from './tokens.js';

let _tokenToOperation: Record<number, Operation> | undefined;

function getTokenToOperation(): Record<number, Operation> {
  if (!_tokenToOperation) {
    _tokenToOperation = Object.fromEntries(
      (Object.entries(OPERATION_TO_TOKEN) as [OperationEnum, number][]).map(
        ([name, token]) => [token, OPERATIONS[name]],
      ),
    );
  }
  return _tokenToOperation;
}

/**
 * Convert postfix tokens to an infix equation string.
 * Uses the same display formatting as the solver's Operation.display().
 */
export function postfixToInfix(tokens: number[]): string {
  const stack: { text: string; isLeaf: boolean }[] = [];

  for (const token of tokens) {
    if (isOperationToken(token)) {
      const right = stack.pop()!;
      const left = stack.pop()!;
      const operation = getTokenToOperation()[token];
      const displayText = operation.display(left.text, right.text);

      // Apply grouping: root level (when stack is empty after this push) gets no grouping,
      // but we always wrap with the operation's displayGroup since the parent will decide.
      // Actually, we need to track whether this will be used as a sub-expression.
      // We wrap it now; the final result (root) won't be wrapped.
      stack.push({
        text: displayText,
        isLeaf: false,
      });
    } else {
      stack.push({
        text: `${token}`,
        isLeaf: true,
      });
    }
  }

  return stack[0].text;
}

/**
 * Convert postfix tokens to an infix equation string with proper grouping
 * (parentheses for sub-expressions where needed).
 * This matches the solver's original formatting with displayGroup.
 */
export function postfixToInfixGrouped(tokens: number[]): string {
  // We need to know which operations are "root level" (no parent).
  // The last operation token in a postfix expression is always the root.
  // Sub-expressions need displayGroup applied.

  interface StackEntry {
    text: string;
    isLeaf: boolean;
  }

  const stack: StackEntry[] = [];

  // Find the index of the last operation token (this is the root operation)
  let lastOpIndex = -1;
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (isOperationToken(tokens[i])) {
      lastOpIndex = i;
      break;
    }
  }

  let opCounter = 0;
  let currentOpIndex = -1;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (isOperationToken(token)) {
      currentOpIndex = i;
      const right = stack.pop()!;
      const left = stack.pop()!;
      const operation = getTokenToOperation()[token];
      const displayText = operation.display(left.text, right.text);
      const isRoot = currentOpIndex === lastOpIndex;

      stack.push({
        text: isRoot ? displayText : operation.displayGroup(displayText),
        isLeaf: false,
      });
      opCounter++;
    } else {
      stack.push({
        text: `${token}`,
        isLeaf: true,
      });
    }
  }

  return stack[0].text;
}
