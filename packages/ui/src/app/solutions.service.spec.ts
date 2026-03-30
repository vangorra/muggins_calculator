import { TestBed } from '@angular/core/testing';
import { SolutionsService, SOLUTIONS_WORKER_API } from './solutions.service';
import { solutionsWorkerFunctions } from './solver/solutions-worker-impl';
import {
  OperationEnum,
  OPERATION_TO_TOKEN,
  DB_VERSION,
  MugbinWriter,
  packTokens,
} from '@muggins_calculator/common';

/**
 * Build a mugbin buffer with known test data (v2 format).
 * faces [1,2], plus (mask=1): total=3, 1 equation "1 2 +"
 * faces [1,2], minus (mask=2): total=1, 1 equation "2 1 -"
 * In v2, both are in a single index entry keyed by faces [1,2].
 */
async function buildTestMugbin(): Promise<Uint8Array> {
  const writer = new MugbinWriter();

  // faces [1,2], plus, total=3: "1 2 +" in postfix
  const tokensPlus = [1, 2, OPERATION_TO_TOKEN[OperationEnum.PLUS]];
  writer.addEquations([1, 2], 1, 3, packTokens(tokensPlus), 1);

  // faces [1,2], minus, total=1: "2 1 -" in postfix
  const tokensMinus = [2, 1, OPERATION_TO_TOKEN[OperationEnum.MINUS]];
  writer.addEquations([1, 2], 2, 1, packTokens(tokensMinus), 1);

  return writer.build();
}

/**
 * Build a mugbin buffer with a mismatched DB version.
 */
async function buildMismatchedVersionMugbin(): Promise<Uint8Array> {
  const data = await buildTestMugbin();
  // Byte 7 is the DB version
  data[7] = DB_VERSION + 1;
  return data;
}

function mockFetchForMugbin(mugbinData: Uint8Array): void {
  const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (!url.includes('.mugbin')) {
      return new Response(null, { status: 404 });
    }

    const rangeHeader = (init?.headers as Record<string, string>)?.Range;
    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d+)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = parseInt(match[2], 10);
        const slice = mugbinData.slice(start, end + 1);
        return new Response(slice as unknown as BodyInit, {
          status: 206,
          headers: { 'Content-Range': `bytes ${start}-${end}/${mugbinData.length}` },
        });
      }
    }

    return new Response(mugbinData as unknown as BodyInit, { status: 200 });
  });
  vi.stubGlobal('fetch', fetchSpy);
}

function mockFetchFailing(): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
}

describe(SolutionsService.name, () => {
  let service: SolutionsService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    solutionsWorkerFunctions.resetSolutions();
    TestBed.configureTestingModule({
      providers: [
        { provide: SOLUTIONS_WORKER_API, useValue: solutionsWorkerFunctions },
      ],
    });
    service = TestBed.inject(SolutionsService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  describe('version check', () => {
    it('accepts matching DB version', async () => {
      const data = await buildTestMugbin();
      mockFetchForMugbin(data);

      // faces [5,6] not in the test data → returns null, but no version error
      const result = await service.getJumpData(2, [5, 6], [OperationEnum.PLUS], () => {});

      expect(result).toBeNull();
      expect(localStorage.getItem('solutions_db_refresh')).toBeNull();
    });

    it('triggers reload on version mismatch', async () => {
      const data = await buildMismatchedVersionMugbin();
      mockFetchForMugbin(data);
      const reloadFn = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { ...window.location, reload: reloadFn },
        writable: true,
        configurable: true,
      });

      await service.getJumpData(2, [1, 2], [OperationEnum.PLUS], () => {});

      expect(localStorage.getItem('solutions_db_refresh')).toBe('1');
      expect(reloadFn).toHaveBeenCalled();
    });

    it('disables DB after refresh still has version mismatch', async () => {
      localStorage.setItem('solutions_db_refresh', '1');
      const data = await buildMismatchedVersionMugbin();
      mockFetchForMugbin(data);
      const reloadFn = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { ...window.location, reload: reloadFn },
        writable: true,
        configurable: true,
      });

      const result = await service.getJumpData(2, [1, 2], [OperationEnum.PLUS], () => {});

      expect(result).toBeNull();
      expect(localStorage.getItem('solutions_db_refresh')).toBeNull();
      expect(reloadFn).not.toHaveBeenCalled();
    });

    it('clears refresh flag on successful version check', async () => {
      localStorage.setItem('solutions_db_refresh', '1');
      const data = await buildTestMugbin();
      mockFetchForMugbin(data);

      await service.getJumpData(2, [5, 6], [OperationEnum.PLUS], () => {});

      expect(localStorage.getItem('solutions_db_refresh')).toBeNull();
    });
  });

  describe('getJumpData', () => {
    it('returns null when faces are not in the file', async () => {
      const data = await buildTestMugbin();
      mockFetchForMugbin(data);

      const result = await service.getJumpData(2, [5, 6], [OperationEnum.PLUS], () => {});

      expect(result).toBeNull();
    });

    it('returns a Map of totals when faces exist', async () => {
      const data = await buildTestMugbin();
      mockFetchForMugbin(data);

      const progressCalls: [number, number][] = [];
      const result = await service.getJumpData(
        2,
        [1, 2],
        [OperationEnum.PLUS],
        (completed, total) => progressCalls.push([completed, total]),
      );

      expect(result).not.toBeNull();
      expect(result!.get(3)).toBe(1);
      expect(result!.size).toBe(1);
      // Progress callback should fire
      expect(progressCalls.length).toBeGreaterThan(0);
    });

    it('aggregates counts across multiple ops in same entry', async () => {
      const data = await buildTestMugbin();
      mockFetchForMugbin(data);

      // Enable both plus and minus (mask=3) → both summary entries match
      const result = await service.getJumpData(
        2,
        [1, 2],
        [OperationEnum.PLUS, OperationEnum.MINUS],
        () => {},
      );

      expect(result).not.toBeNull();
      expect(result!.get(3)).toBe(1); // from plus entry
      expect(result!.get(1)).toBe(1); // from minus entry
    });

    it('sorts faces before lookup', async () => {
      const data = await buildTestMugbin();
      mockFetchForMugbin(data);

      // Pass faces in reverse order
      const result = await service.getJumpData(2, [2, 1], [OperationEnum.PLUS], () => {});

      expect(result).not.toBeNull();
      expect(result!.get(3)).toBe(1);
    });

    it('returns null when fetch fails', async () => {
      mockFetchFailing();

      const result = await service.getJumpData(2, [1, 2], [OperationEnum.PLUS], () => {});

      expect(result).toBeNull();
    });
  });

  describe('getEquationsForTotal', () => {
    it('returns equations decoded from binary postfix', async () => {
      const data = await buildTestMugbin();
      mockFetchForMugbin(data);

      const result = await service.getEquationsForTotal(2, [1, 2], 3, [OperationEnum.PLUS]);

      expect(result).not.toBeNull();
      expect(result!).toHaveLength(1);
      expect(result![0].equation).toBe('1 + 2');
      expect(result![0].total).toBe(3);
      expect(result![0].fullEquation).toBe('3 = 1 + 2');
    });

    it('returns null when faces are not in file', async () => {
      const data = await buildTestMugbin();
      mockFetchForMugbin(data);

      const result = await service.getEquationsForTotal(2, [5, 6], 3, [OperationEnum.PLUS]);

      expect(result).toBeNull();
    });

    it('returns null when fetch fails', async () => {
      mockFetchFailing();

      const result = await service.getEquationsForTotal(2, [1, 2], 3, [OperationEnum.PLUS]);

      expect(result).toBeNull();
    });

    it('returns empty array for non-existent total', async () => {
      const data = await buildTestMugbin();
      mockFetchForMugbin(data);

      const result = await service.getEquationsForTotal(2, [1, 2], 99, [OperationEnum.PLUS]);

      expect(result).not.toBeNull();
      expect(result!).toHaveLength(0);
    });
  });
});
