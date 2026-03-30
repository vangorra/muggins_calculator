import { OPERATION_TO_TOKEN, OperationEnum } from './tokens.js';
import { postfixToInfixGrouped } from './postfix.js';

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

export interface MugginsSolverCalculateConfig {
  readonly minTotal: number;
  readonly maxTotal: number;
  readonly faces: number[];
  readonly operations: OperationEnum[];
}

export interface CalculateEquationResult {
  readonly total: number;
  readonly equation: string;
  readonly fullEquation: string;
  readonly sortableEquation: string;
  readonly postfixTokens: number[];
}

export const EQUATION_FORMATTER = (total: string | number, equation: string) =>
  `${total} = ${equation}`;
const GROUPING_PARENTHESIS = (text: string) => `(${text})`;
const GROUPING_NONE = (text: string) => text;

type OperationsRecord = { [K in OperationEnum]: Operation & { readonly id: K } };

export const OPERATIONS: OperationsRecord = {
  [OperationEnum.PLUS]: {
    name: 'Plus',
    id: OperationEnum.PLUS,
    solve: (left: number, right: number) => left + right,
    display: (left: any, right: any) => `${left} + ${right}`,
    displayGroup: GROUPING_PARENTHESIS,
    isCommutative: true,
    exampleNumbers: { left: 6, right: 2 },
  },
  [OperationEnum.MINUS]: {
    name: 'Minus',
    id: OperationEnum.MINUS,
    solve: (left: number, right: number) => left - right,
    display: (left: any, right: any) => `${left} - ${right}`,
    displayGroup: GROUPING_PARENTHESIS,
    isCommutative: false,
    exampleNumbers: { left: 6, right: 2 },
  },
  [OperationEnum.MULTIPLY]: {
    name: 'Multiply',
    id: OperationEnum.MULTIPLY,
    solve: (left: number, right: number) => left * right,
    display: (left: any, right: any) => `${left} * ${right}`,
    displayGroup: GROUPING_PARENTHESIS,
    isCommutative: true,
    exampleNumbers: { left: 6, right: 2 },
  },
  [OperationEnum.DIVIDE]: {
    name: 'Divide',
    id: OperationEnum.DIVIDE,
    solve: (left: number, right: number) => left / right,
    display: (left: any, right: any) => `${left} / ${right}`,
    displayGroup: GROUPING_PARENTHESIS,
    isCommutative: false,
    exampleNumbers: { left: 6, right: 2 },
  },
  [OperationEnum.POWER]: {
    name: 'Power',
    id: OperationEnum.POWER,
    solve: (left: number, right: number) => left ** right,
    display: (left: any, right: any) => `${left} ^ ${right}`,
    displayGroup: GROUPING_NONE,
    isCommutative: false,
    exampleNumbers: { left: 5, right: 2 },
  },
  [OperationEnum.ROOT]: {
    name: 'Root',
    id: OperationEnum.ROOT,
    solve: (left: number, right: number) => Math.pow(left, 1 / right),
    display: (left: any, right: any) => `root(${left})(${right})`,
    displayGroup: GROUPING_NONE,
    isCommutative: false,
    exampleNumbers: { left: 27, right: 3 },
  },
  [OperationEnum.MODULO]: {
    name: 'Modulo',
    id: OperationEnum.MODULO,
    solve: (left: number, right: number) => left % right,
    display: (left: any, right: any) => `${left} % ${right}`,
    displayGroup: GROUPING_PARENTHESIS,
    isCommutative: false,
    exampleNumbers: { left: 5, right: 3 },
  },
};

export const OPERATIONS_LIST: Operation[] = Object.values(OPERATIONS);

const SORTABLE_EQUATION_REGEX = /[()=]/g;
const SORTABLE_EQUATION_CHAR_MAP: Record<string, string> = { '(': 'X', ')': 'Y', '=': 'Z' };

/**
 * In ASCII, operators like + - /, etc come before numbers. This means when sorting equations at the end,
 * the operators take precedence. So equations like '(8 + 1) + 2' come before '2 + (8 + 1)'. To fix this,
 * we replace non-alphanum with Z. This ensures the numbers are prioritized and parenthesis
 * are sort to the bottom.
 * @param equation
 */
export function getSortableEquation(equation: string): string {
  return equation.replace(SORTABLE_EQUATION_REGEX, (char) => SORTABLE_EQUATION_CHAR_MAP[char]);
}



/**
 * Generate all unique permutations of a number array using backtracking.
 * Skips duplicate permutations when the input contains repeated values,
 * avoiding the O(n!) generation + dedup overhead of the naive approach.
 * @param items
 */
function uniquePermutations(items: number[]): number[][] {
  const results: number[][] = [];
  const sorted = [...items].sort((a, b) => a - b);
  const used = new Array(sorted.length).fill(false);
  const current: number[] = [];

  function backtrack(): void {
    if (current.length === sorted.length) {
      results.push([...current]);
      return;
    }
    for (let i = 0; i < sorted.length; i++) {
      if (used[i]) continue;
      // Skip duplicates: same value as previous and previous was not used in this branch.
      if (i > 0 && sorted[i] === sorted[i - 1] && !used[i - 1]) continue;
      used[i] = true;
      current.push(sorted[i]);
      backtrack();
      current.pop();
      used[i] = false;
    }
  }

  backtrack();
  return results;
}

/** Entry on the evaluation stack during flat postfix calculation. */
interface StackEntry {
  total: number;
  /** Index of this subtree's first token in the shared buffer. */
  start: number;
  isLeaf: boolean;
}

/**
 * Comparator used to canonicalise commutative operands: ensures the
 * "smaller" subtree is always written first in the postfix buffer, producing
 * a single canonical form regardless of how face values were originally ordered.
 */
function compareForSort(a: StackEntry, b: StackEntry): number {
  if (a.isLeaf && a.total < b.total) return -1;
  if (b.isLeaf && b.total < a.total) return 1;
  if (a.isLeaf) return -1;
  if (b.isLeaf) return 1;
  if (a.total < b.total) return -1;
  if (b.total < a.total) return 1;
  return 0;
}

/**
 * Generate all valid postfix shape patterns for N values.
 * Each pattern is a boolean[] where true = value slot, false = operator slot.
 * Count equals the (N-1)th Catalan number: 1, 2, 5, 14 for N = 2, 3, 4, 5.
 *
 * A valid postfix pattern satisfies: at every prefix, #values > #operators.
 */
function buildCatalanPatterns(n: number): boolean[][] {
  const results: boolean[][] = [];
  const current: boolean[] = [];

  function build(vLeft: number, oLeft: number): void {
    if (vLeft === 0 && oLeft === 0) {
      results.push([...current]);
      return;
    }
    if (vLeft > 0) {
      current.push(true);
      build(vLeft - 1, oLeft);
      current.pop();
    }
    // An operator can be placed only when enough values have already been placed:
    // vPlaced (= n - vLeft) must exceed oPlaced + 1 (= n - oLeft).
    // Simplifies to: oLeft > vLeft.
    if (oLeft > 0 && oLeft > vLeft) {
      current.push(false);
      build(vLeft, oLeft - 1);
      current.pop();
    }
  }

  build(n, n - 1);
  return results;
}

const catalanPatternsCache = new Map<number, boolean[][]>();

function getCatalanPatterns(n: number): boolean[][] {
  let patterns = catalanPatternsCache.get(n);
  if (!patterns) {
    patterns = buildCatalanPatterns(n);
    catalanPatternsCache.set(n, patterns);
  }
  return patterns;
}

function getOperationPermutations(
  config: MugginsSolverCalculateConfig
): OperationEnum[][] {
  let result: OperationEnum[][] = [[]];
  for (let i = 0; i < config.faces.length - 1; i++) {
    result = result.flatMap((combo) => config.operations.map((op) => [...combo, op]));
  }
  return result;
}

function getFaceAndOperationPermutations(
  config: MugginsSolverCalculateConfig
): { facePermutations: number[][], operationPermutations: OperationEnum[][] } {
  return {
    facePermutations: uniquePermutations(config.faces),
    operationPermutations: getOperationPermutations(config),
  };
}

export function combineResults(resultsArrs: CalculateEquationResult[][]): CalculateEquationResult[] {
  const seen = new Map<string, CalculateEquationResult>();
  for (const arr of resultsArrs) {
    for (const result of arr) {
      if (!seen.has(result.sortableEquation)) {
        seen.set(result.sortableEquation, result);
      }
    }
  }
  return [...seen.values()].sort((a, b) =>
    a.sortableEquation < b.sortableEquation ? -1 : a.sortableEquation > b.sortableEquation ? 1 : 0
  );
}

export function calculateFromFaceAndOperationPermutations(
  config: MugginsSolverCalculateConfig,
  facePermutations: number[][],
  operationPermutations: OperationEnum[][]
): CalculateEquationResult[] {
  const results: CalculateEquationResult[] = [];

  for (const { total, postfixTokens } of generateResults(config, facePermutations, operationPermutations)) {
    const equation = postfixToInfixGrouped(postfixTokens);
    const sortableEquation = getSortableEquation(
      EQUATION_FORMATTER(`${total}`.padStart(4, '0'), equation)
    );
    results.push({
      total,
      equation,
      fullEquation: EQUATION_FORMATTER(total, equation),
      sortableEquation,
      postfixTokens,
    });
  }

  return results.sort((a, b) =>
    a.sortableEquation < b.sortableEquation ? -1 : a.sortableEquation > b.sortableEquation ? 1 : 0
  );
}

/**
 * Generate all unique multiset combinations with repetition.
 * For dieCount=3, maxFaceValue=6, produces C(6+2, 3)=56 sorted combinations.
 * Each combination is sorted ascending (e.g., [1,1,2], [1,2,3], ..., [6,6,6]).
 */
export function generateFaceCombinations(dieCount: number, maxFaceValue: number): number[][] {
  const results: number[][] = [];

  function generate(current: number[], minValue: number, remaining: number): void {
    if (remaining === 0) {
      results.push(current);
      return;
    }
    for (let value = minValue; value <= maxFaceValue; value++) {
      generate([...current, value], value, remaining - 1);
    }
  }

  generate([], 1, dieCount);
  return results;
}

/**
 * Pack postfix tokens into a numeric deduplication key.
 *
 * Each token is a 5-bit value (1–31: face values 1–10, operation tokens 25–31).
 * Packing N tokens requires N*5 bits:
 *   - 2 dice →  3 tokens = 15 bits → safe JS number
 *   - 3 dice →  5 tokens = 25 bits → safe JS number
 *   - 4 dice →  7 tokens = 35 bits → safe JS number (< 2^53)
 *   - 5 dice →  9 tokens = 45 bits → safe JS number (< 2^53)
 *   - 6 dice → 11 tokens = 55 bits → exceeds 2^53, returns BigInt
 *
 * Accepts an ArrayLike<number> and explicit length so the caller can read
 * directly from a shared buffer without slicing first.
 *
 * Using a numeric key avoids the string allocation of `tokens.join(',')` in
 * the hot deduplication loop inside generateResults.
 */
function packTokenKey(tokens: ArrayLike<number>, length: number): number | bigint {
  if (length <= 10) {
    // Up to 50 bits — fits in a JS safe integer (max 2^53 - 1).
    // Multiply by 32 (= 2^5) then add the next token, equivalent to
    // left-shifting 5 bits per token but safe for integers > 32 bits.
    let key = 0;
    for (let i = 0; i < length; i++) key = key * 32 + tokens[i];
    return key;
  }
  // 11+ tokens (6 dice = 55 bits) — use BigInt to avoid precision loss.
  let key = 0n;
  for (let i = 0; i < length; i++) key = key * 32n + BigInt(tokens[i]);
  return key;
}

/**
 * Lightweight result type — no string fields.
 */
export interface DbResult {
  readonly total: number;
  readonly postfixTokens: number[];
}

/**
 * Lazily yields all Operation[] combinations from placing `ops` across
 * `slotCount` positions — equivalent to crossProduct of `slotCount` identical
 * arrays followed by mapping enums to Operation objects, but without ever
 * materializing all 7^(N-1) combinations simultaneously.
 *
 * Yields the same internal buffer object on every iteration. This is safe
 * because generateResults processes each combination synchronously before
 * the generator advances to the next value.
 */
function* lazyOperationPermutations(ops: Operation[], slotCount: number): Generator<Operation[]> {
  if (slotCount === 0) {
    yield [];
    return;
  }
  const buf = new Array<Operation>(slotCount);
  function* fill(depth: number): Generator<Operation[]> {
    if (depth === slotCount) {
      yield buf; // safe: caller uses buf synchronously before the next yield
      return;
    }
    for (const op of ops) {
      buf[depth] = op;
      yield* fill(depth + 1);
    }
  }
  yield* fill(0);
}

/**
 * Generator that yields deduplicated {total, postfixTokens} results.
 *
 * Enumerates all expression trees by combining:
 *   - Catalan postfix shape patterns (C(N-1) structural templates)
 *   - Unique face value orderings
 *   - All operation combinations
 *
 * Evaluates each combination with a stack-based postfix evaluator that writes
 * tokens directly into a pre-allocated buffer. Commutative operations are
 * canonicalised in-place (smaller subtree written first) so duplicate
 * expressions are caught by the numeric dedup key.
 *
 * Can be called with explicit permutations (for chunked worker dispatch)
 * or with just config (generates permutations internally).
 *
 * When called with config only, operation permutations are generated lazily
 * via lazyOperationPermutations to avoid materializing all 7^(N-1)
 * combinations at once.
 */
export interface GenerateResultsOptions {
  /** When false, the caller handles deduplication externally (default: true). */
  readonly deduplicate?: boolean;
}

export function* generateResults(
  config: MugginsSolverCalculateConfig,
  facePermutations?: number[][],
  operationPermutations?: OperationEnum[][],
  options?: GenerateResultsOptions,
): Generator<DbResult> {
  const n = config.faces.length;
  const tokenCount = n * 2 - 1;
  const patterns = getCatalanPatterns(n);
  const facePairings = facePermutations ?? uniquePermutations(config.faces);

  // For the explicit-permutations path (UI solver): pre-map OperationEnum[][] to
  // Operation[][] once — the resulting array is re-iterable across all face orderings.
  // For the config-only path (CLI / generation): build a lazy generator factory so
  // that only one Operation[] exists at a time and is reused across iterations.
  let operationsSource: () => Iterable<Operation[]>;
  if (operationPermutations) {
    const mapped = operationPermutations.map((ops) => ops.map((op) => OPERATIONS[op]));
    operationsSource = () => mapped;
  } else {
    const operationList = config.operations.map((op) => OPERATIONS[op]);
    const slotCount = n - 1;
    operationsSource = () => lazyOperationPermutations(operationList, slotCount);
  }

  const deduplicate = options?.deduplicate !== false;

  const buffer = new Array<number>(tokenCount);
  // Reusable scratch space for commutative region swaps — avoids per-swap allocation.
  const temp = new Array<number>(tokenCount);
  const seen = deduplicate ? new Set<number | bigint>() : null;
  // Pre-allocate stack entries to avoid per-iteration object allocation.
  const stack: StackEntry[] = Array.from({ length: n }, () => ({ total: 0, start: 0, isLeaf: false }));

  for (const pattern of patterns) {
    for (const faceOrder of facePairings) {
      for (const ops of operationsSource()) {
        let vi = 0;
        let oi = 0;
        let pos = 0;
        let stackTop = 0;
        let failed = false;

        for (let si = 0; si < tokenCount; si++) {
          if (pattern[si]) {
            // Value slot: push face token onto stack.
            const val = faceOrder[vi++];
            const entry = stack[stackTop++];
            entry.total = val;
            entry.start = pos;
            entry.isLeaf = true;
            buffer[pos++] = val;
          } else {
            // Operator slot: pop two operands, apply op, push result.
            const op = ops[oi++];
            const right = stack[--stackTop];
            const left = stack[--stackTop];

            let leftTotal = left.total;
            let rightTotal = right.total;

            // Commutative canonicalization: swap buffer regions so the "smaller"
            // subtree is always written first, producing a unique canonical form.
            if (op.isCommutative && compareForSort(left, right) > 0) {
              const leftLen = right.start - left.start;
              const rightLen = pos - right.start;
              for (let i = 0; i < leftLen + rightLen; i++) temp[i] = buffer[left.start + i];
              for (let i = 0; i < rightLen; i++) buffer[left.start + i] = temp[leftLen + i];
              for (let i = 0; i < leftLen; i++) buffer[left.start + rightLen + i] = temp[i];
              leftTotal = right.total;
              rightTotal = left.total;
            }

            const total = op.solve(leftTotal, rightTotal);
            if (!Number.isFinite(total)) { failed = true; break; }

            // Re-use the left stack slot for the combined result.
            const entry = stack[stackTop++];
            entry.total = total;
            entry.start = left.start;
            entry.isLeaf = false;
            buffer[pos++] = OPERATION_TO_TOKEN[op.id];
          }
        }

        if (failed) continue;

        const total = stack[0].total;
        if (!Number.isInteger(total) || total < config.minTotal || total > config.maxTotal) continue;

        if (seen) {
          const dedupKey = packTokenKey(buffer, tokenCount);
          if (!seen.has(dedupKey)) {
            seen.add(dedupKey);
            yield { total, postfixTokens: buffer.slice(0, tokenCount) };
          }
        } else {
          yield { total, postfixTokens: buffer.slice(0, tokenCount) };
        }
      }
    }
  }
}

export const commonWorkerFunctions = {
  getFaceAndOperationPermutations,
  calculateFromFaceAndOperationPermutations,
  combineResults,
};
