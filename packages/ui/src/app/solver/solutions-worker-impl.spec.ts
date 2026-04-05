import {
  OperationEnum,
  MugbinWriter,
  operationsToMask,
  packTokens,
  OPERATION_TO_TOKEN,
} from '@muggins_calculator/common';
import { solutionsWorkerFunctions } from './solutions-worker-impl';

// Mock fetch globally
const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

/**
 * Helper: build a mugbin buffer and wire up fetch to serve range requests from it.
 */
async function buildAndServeMugbin(
  faces: number[],
  equations: { total: number; opsMask: number; postfixTokenNums: number[] }[],
): Promise<Uint8Array> {
  const writer = new MugbinWriter();

  // Group equations by (total, opsMask)
  const groups = new Map<string, { total: number; opsMask: number; tokenArrays: number[][] }>();
  for (const eq of equations) {
    const key = `${eq.total}-${eq.opsMask}`;
    let group = groups.get(key);
    if (!group) {
      group = { total: eq.total, opsMask: eq.opsMask, tokenArrays: [] };
      groups.set(key, group);
    }
    group.tokenArrays.push(eq.postfixTokenNums);
  }

  for (const group of groups.values()) {
    const packedArrays = group.tokenArrays.map((t) => packTokens(t));
    const eqByteLen = packedArrays[0].length;
    const combined = new Uint8Array(eqByteLen * packedArrays.length);
    packedArrays.forEach((p, i) => combined.set(p, i * eqByteLen));
    writer.addEquations(faces, group.opsMask, group.total, combined, packedArrays.length);
  }

  const buffer = await writer.build();

  mockFetch.mockImplementation(async (_url: string, init?: RequestInit) => {
    const rangeHeader = (init?.headers as Record<string, string>)?.['Range'];
    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d+)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = parseInt(match[2], 10);
        const slice = buffer.slice(start, end + 1);
        return {
          ok: false,
          status: 206,
          arrayBuffer: () =>
            Promise.resolve(
              slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength),
            ),
        };
      }
    }
    return {
      ok: true,
      status: 200,
      arrayBuffer: () =>
        Promise.resolve(
          buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        ),
    };
  });

  return buffer;
}

describe('FetchDataSource HTTP error', () => {
  it('initSolutionsReader throws when fetch returns non-ok non-206 status', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });

    await expect(
      solutionsWorkerFunctions.initSolutionsReader(3),
    ).rejects.toThrow();
  });
});

describe('solutionsWorkerFunctions', () => {
  beforeEach(() => {
    solutionsWorkerFunctions.resetSolutions();
    mockFetch.mockReset();
  });

  describe('getJumpData', () => {
    it('returns null when reader is not initialized', async () => {
      const result = await solutionsWorkerFunctions.getJumpData(
        3,
        [1, 2, 3],
        [OperationEnum.PLUS],
        () => {},
      );
      expect(result).toBeNull();
    });

    it('returns null when reader throws an error', async () => {
      const ops = [OperationEnum.PLUS];
      const opsMask = operationsToMask(ops);

      await buildAndServeMugbin([1, 2, 3], [
        { total: 6, opsMask, postfixTokenNums: [1, 2, OPERATION_TO_TOKEN[OperationEnum.PLUS], 3, OPERATION_TO_TOKEN[OperationEnum.PLUS]] },
      ]);

      await solutionsWorkerFunctions.initSolutionsReader(3);

      // Now make fetch fail for the data read
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await solutionsWorkerFunctions.getJumpData(
        3,
        [1, 2, 3],
        ops,
        () => {},
      );
      expect(result).toBeNull();
    });
  });

  describe('getEquationsForTotal', () => {
    it('returns null when reader is not initialized', async () => {
      const result = await solutionsWorkerFunctions.getEquationsForTotal(
        3,
        [1, 2, 3],
        6,
        [OperationEnum.PLUS],
      );
      expect(result).toBeNull();
    });

    it('returns null when reader throws an error', async () => {
      const ops = [OperationEnum.PLUS];
      const opsMask = operationsToMask(ops);

      await buildAndServeMugbin([1, 2, 3], [
        { total: 6, opsMask, postfixTokenNums: [1, 2, OPERATION_TO_TOKEN[OperationEnum.PLUS], 3, OPERATION_TO_TOKEN[OperationEnum.PLUS]] },
      ]);

      await solutionsWorkerFunctions.initSolutionsReader(3);

      // Now make fetch fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await solutionsWorkerFunctions.getEquationsForTotal(
        3,
        [1, 2, 3],
        6,
        ops,
      );
      expect(result).toBeNull();
    });

    it('returns sorted equations for multiple results', async () => {
      const ops = [OperationEnum.PLUS];
      const opsMask = operationsToMask(ops);
      const PLUS = OPERATION_TO_TOKEN[OperationEnum.PLUS];

      // Two equations for total=6: "2 1 + 3 +" and "1 2 + 3 +"
      await buildAndServeMugbin([1, 2, 3], [
        { total: 6, opsMask, postfixTokenNums: [2, 1, PLUS, 3, PLUS] },
        { total: 6, opsMask, postfixTokenNums: [1, 2, PLUS, 3, PLUS] },
      ]);

      await solutionsWorkerFunctions.initSolutionsReader(3);

      const result = await solutionsWorkerFunctions.getEquationsForTotal(
        3,
        [1, 2, 3],
        6,
        ops,
      );

      expect(result).not.toBeNull();
      expect(result!.length).toBe(2);
      // Verify sorted order
      for (let i = 0; i < result!.length - 1; i++) {
        expect(result![i].equation <= result![i + 1].equation).toBe(true);
      }
      // All should have total 6
      for (const r of result!) {
        expect(r.total).toBe(6);
      }
    });
  });

  describe('initSolutionsReader', () => {
    it('initializes and returns db version', async () => {
      await buildAndServeMugbin([1, 2], []);
      const version = await solutionsWorkerFunctions.initSolutionsReader(2);
      expect(typeof version).toBe('number');
    });
  });

  describe('resetSolutions', () => {
    it('clears all readers', async () => {
      await buildAndServeMugbin([1, 2], []);
      await solutionsWorkerFunctions.initSolutionsReader(2);

      solutionsWorkerFunctions.resetSolutions();

      const result = await solutionsWorkerFunctions.getJumpData(
        2,
        [1, 2],
        [OperationEnum.PLUS],
        () => {},
      );
      expect(result).toBeNull();
    });
  });
});
