import {
  CalculateEquationResult,
  OperationEnum,
  operationsToMask,
  isOperationToken,
  OPERATION_MASKS,
  OPERATION_TO_TOKEN,
  postfixToInfixGrouped,
  getSortableEquation,
  EQUATION_FORMATTER,
  MugbinReader,
  MugbinDataSource,
} from '@muggins_calculator/common';

/** Compute the opsMask directly from postfix tokens. */
function tokensMask(postfixTokens: number[]): number {
  const tokenToMask: Record<number, number> = {};
  for (const [name, token] of Object.entries(OPERATION_TO_TOKEN) as [
    OperationEnum,
    number
  ][]) {
    tokenToMask[token] = OPERATION_MASKS[name];
  }
  let mask = 0;
  for (const t of postfixTokens) {
    if (isOperationToken(t)) {
      mask |= tokenToMask[t] ?? 0;
    }
  }
  return mask;
}

class FetchDataSource implements MugbinDataSource {
  constructor(private url: string) {}

  async readBytes(offset: number, length: number): Promise<Uint8Array> {
    const response = await fetch(this.url, {
      headers: {
        Range: `bytes=${offset}-${offset + length - 1}`,
      },
    });
    if (!response.ok && response.status !== 206) {
      throw new Error(
        `HTTP ${response.status} fetching range ${offset}-${
          offset + length - 1
        }`
      );
    }
    return new Uint8Array(await response.arrayBuffer());
  }
}

const readers = new Map<number, MugbinReader>();

async function initSolutionsReader(diceCount: number): Promise<number> {
  const baseHref = new URL('.', self.location.href).pathname;
  const source = new FetchDataSource(
    `${baseHref}solutions-${diceCount}d.mugbin`
  );
  const reader = new MugbinReader(source);
  await reader.loadIndex();
  readers.set(diceCount, reader);
  return reader.getDbVersion();
}

async function getJumpData(
  diceCount: number,
  faces: number[],
  operations: OperationEnum[],
  onProgress: (completed: number, total: number) => void
): Promise<Map<number, number> | null> {
  const reader = readers.get(diceCount);
  if (!reader) return null;

  const opsMask = operationsToMask(operations);
  const entries = reader.findEntries(faces);
  if (entries.length === 0) return null;

  try {
    const result = await reader.getJumpData(entries, opsMask, onProgress);
    return result.size > 0 ? result : null;
  } catch (e) {
    console.error('getJumpData failed:', e);
    return null;
  }
}

async function getEquationsForTotal(
  diceCount: number,
  faces: number[],
  total: number,
  operations: OperationEnum[]
): Promise<CalculateEquationResult[] | null> {
  const reader = readers.get(diceCount);
  if (!reader) return null;

  const opsMask = operationsToMask(operations);
  const entries = reader.findEntries(faces);
  if (entries.length === 0) return null;

  try {
    const rawResults = await reader.getEquationsForTotal(
      entries,
      total,
      opsMask
    );

    // Defense-in-depth: verify each equation only uses enabled operations.
    // The mugbin reader filters at the summary level (by opsMask group), but this
    // post-filter catches any edge case where a mismatched equation slips through.
    const results: CalculateEquationResult[] = [];
    for (const { postfixTokens } of rawResults) {
      if ((tokensMask(postfixTokens) & ~opsMask) !== 0) continue;
      const equation = postfixToInfixGrouped(postfixTokens);
      results.push({
        total,
        equation,
        fullEquation: EQUATION_FORMATTER(total, equation),
        sortableEquation: getSortableEquation(equation),
        postfixTokens,
      });
    }

    results.sort((a, b) =>
      a.equation < b.equation ? -1 : a.equation > b.equation ? 1 : 0
    );

    return results;
  } catch {
    return null;
  }
}

function resetSolutions(): void {
  readers.clear();
}

export const solutionsWorkerFunctions = {
  initSolutionsReader,
  getJumpData,
  getEquationsForTotal,
  resetSolutions,
};

export type SolutionsWorkerApi = typeof solutionsWorkerFunctions;
