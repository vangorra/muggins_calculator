import {
  CalculateEquationResult,
  OperationEnum,
  operationsToMask,
  postfixToInfixGrouped,
  getSortableEquation,
  EQUATION_FORMATTER,
  MugbinReader,
  MugbinDataSource,
} from '@muggins_calculator/common';

class FetchDataSource implements MugbinDataSource {
  constructor(private url: string) {}

  async readBytes(offset: number, length: number): Promise<Uint8Array> {
    const response = await fetch(this.url, {
      headers: {
        Range: `bytes=${offset}-${offset + length - 1}`,
      },
    });
    if (!response.ok && response.status !== 206) {
      throw new Error(`HTTP ${response.status} fetching range ${offset}-${offset + length - 1}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }
}

const readers = new Map<number, MugbinReader>();

async function initSolutionsReader(diceCount: number): Promise<number> {
  const source = new FetchDataSource(`/solutions-${diceCount}d.mugbin`);
  const reader = new MugbinReader(source);
  await reader.loadIndex();
  readers.set(diceCount, reader);
  return reader.getDbVersion();
}

async function getJumpData(
  diceCount: number,
  faces: number[],
  operations: OperationEnum[],
  onProgress: (completed: number, total: number) => void,
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
  operations: OperationEnum[],
): Promise<CalculateEquationResult[] | null> {
  const reader = readers.get(diceCount);
  if (!reader) return null;

  const opsMask = operationsToMask(operations);
  const entries = reader.findEntries(faces);
  if (entries.length === 0) return null;

  try {
    const rawResults = await reader.getEquationsForTotal(entries, total, opsMask);

    const results: CalculateEquationResult[] = rawResults.map(({ postfixTokens }) => {
      const equation = postfixToInfixGrouped(postfixTokens);
      return {
        total,
        equation,
        fullEquation: EQUATION_FORMATTER(total, equation),
        sortableEquation: getSortableEquation(equation),
        postfixTokens,
      };
    });

    results.sort((a, b) =>
      a.equation < b.equation ? -1 : a.equation > b.equation ? 1 : 0,
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
