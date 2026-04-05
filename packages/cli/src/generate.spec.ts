import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { EventEmitter } from 'node:events';
import { Worker } from 'node:worker_threads';
import {
  generateSolutions,
  generateSolutionsData,
  generateAndWriteTempFile,
  generateAllSolutions,
  mergeTempMugbinFiles,
  buildSummaryEntries,
  formatTimeRemaining,
  shardedFileName,
} from './generate.js';
import {
  calculateFromFaceAndOperationPermutations,
  commonWorkerFunctions,
  OPERATIONS_LIST,
  unpackTokens,
  packedByteLength,
  postfixToInfixGrouped,
  DB_VERSION,
  MugbinReader,
  BufferDataSource,
} from '@muggins_calculator/common';

vi.mock('node:worker_threads', () => ({
  Worker: vi.fn(),
}));

// Fix CPU count so concurrency is deterministic across machines.
// 6 CPUs → maxConcurrency=5, defaultConcurrency=4 → capped at 3 face combos.
vi.mock('node:os', () => ({
  cpus: () => new Array(6).fill({}),
  totalmem: () => 16 * 1024 * 1024 * 1024, // 16 GB
  freemem: () => 8 * 1024 * 1024 * 1024, // 8 GB free
  tmpdir: () => require('os').tmpdir(),
}));

let tmpDir: string;
let outputPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'muggins-cli-test-'));
  outputPath = path.join(tmpDir, 'solutions.mugbin');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('formatTimeRemaining', () => {
  it('returns empty string when msPerItem is zero', () => {
    expect(formatTimeRemaining(0, 10)).toBe('');
  });

  it('returns empty string when remaining is zero', () => {
    expect(formatTimeRemaining(5000, 0)).toBe('');
  });

  it('formats seconds when under a minute', () => {
    // 5s per item × 9 remaining = 45s
    expect(formatTimeRemaining(5_000, 9)).toBe('~45s remaining');
  });

  it('formats minutes and seconds when over a minute', () => {
    // 30s per item × 9 remaining = 270s = 4m 30s
    expect(formatTimeRemaining(30_000, 9)).toBe('~4m 30s remaining');
  });

  it('formats hours when over an hour', () => {
    // 60s per item × 9 remaining = 540s = 9m
    expect(formatTimeRemaining(60_000, 9)).toBe('~9m remaining');
    // 400s per item × 9 remaining = 3600s = 1h
    expect(formatTimeRemaining(400_000, 9)).toBe('~1h remaining');
    // 1000s per item × 9 remaining = 9000s = 2h 30m
    expect(formatTimeRemaining(1_000_000, 9)).toBe('~2h 30m remaining');
  });

  it('formats days when over a day', () => {
    // 10000s per item × 9 remaining = 90000s = 1d 1h
    expect(formatTimeRemaining(10_000_000, 9)).toBe('~1d 1h remaining');
  });
});

describe('generateSolutionsData', () => {
  it('returns grouped data for a face combination', () => {
    const data = generateSolutionsData([1, 2], 0, 10);

    expect(data.faces).toEqual([1, 2]);
    expect(data.groups.length).toBeGreaterThan(0);

    // All groups should have valid opsMask and total.
    for (const group of data.groups) {
      expect(group.opsMask).toBeGreaterThanOrEqual(1);
      expect(group.opsMask).toBeLessThanOrEqual(127);
      expect(group.total).toBeGreaterThanOrEqual(0);
      expect(group.count).toBeGreaterThan(0);
      expect(group.packedEquations.length).toBeGreaterThan(0);
    }
  });

  it('sorts faces', () => {
    const data = generateSolutionsData([3, 1, 2], 0, 10);
    expect(data.faces).toEqual([1, 2, 3]);
  });

  it('equations decode back to original infix format', () => {
    const faces = [1, 2];
    const allOps = OPERATIONS_LIST.map((op) => op.id);
    const data = generateSolutionsData(faces, 0, 10);

    const diceCount = faces.length;
    const tokenCount = diceCount * 2 - 1;
    const equationLength = packedByteLength(tokenCount);

    const decodedEquations: string[] = [];
    for (const group of data.groups) {
      for (let i = 0; i < group.count; i++) {
        const offset = i * equationLength;
        const packed = group.packedEquations.slice(offset, offset + equationLength);
        const tokens = unpackTokens(packed, tokenCount);
        decodedEquations.push(postfixToInfixGrouped(tokens));
      }
    }
    decodedEquations.sort();

    const calcConfig = { faces, operations: allOps, minTotal: 0, maxTotal: 10 };
    const { facePermutations, operationPermutations } =
      commonWorkerFunctions.getFaceAndOperationPermutations(calcConfig);
    const directResults = calculateFromFaceAndOperationPermutations(
      calcConfig, facePermutations, operationPermutations
    );
    const directEquations = directResults.map((r) => r.equation).sort();

    expect(decodedEquations).toEqual(directEquations);
  });
});

describe('generateSolutions', () => {
  it('writes a valid mugbin file', async () => {
    await generateSolutions({ outputPath, faces: [1, 2], minTotal: 0, maxTotal: 10 });

    expect(fs.existsSync(outputPath)).toBe(true);

    const data = new Uint8Array(fs.readFileSync(outputPath));
    const reader = new MugbinReader(new BufferDataSource(data));
    await reader.loadIndex();

    expect(reader.getDbVersion()).toBe(DB_VERSION);

    const entries = reader.findEntries([1, 2]);
    expect(entries.length).toBe(1);

    const jumpData = await reader.getJumpData(entries, 0x7f);
    expect(jumpData.size).toBeGreaterThan(0);
  });

  it('mugbin equations match direct calculation', async () => {
    const faces = [1, 2];
    const allOps = OPERATIONS_LIST.map((op) => op.id);
    await generateSolutions({ outputPath, faces, minTotal: 0, maxTotal: 10 });

    const data = new Uint8Array(fs.readFileSync(outputPath));
    const reader = new MugbinReader(new BufferDataSource(data));
    await reader.loadIndex();

    const entries = reader.findEntries(faces);
    const jumpData = await reader.getJumpData(entries, 0x7f);

    // Get all equations from the mugbin file.
    const mugbinEquations: string[] = [];
    for (const [total] of jumpData) {
      const eqs = await reader.getEquationsForTotal(entries, total, 0x7f);
      for (const eq of eqs) {
        mugbinEquations.push(postfixToInfixGrouped(eq.postfixTokens));
      }
    }
    mugbinEquations.sort();

    const calcConfig = { faces, operations: allOps, minTotal: 0, maxTotal: 10 };
    const { facePermutations, operationPermutations } =
      commonWorkerFunctions.getFaceAndOperationPermutations(calcConfig);
    const directResults = calculateFromFaceAndOperationPermutations(
      calcConfig, facePermutations, operationPermutations
    );
    const directEquations = directResults.map((r) => r.equation).sort();

    expect(mugbinEquations).toEqual(directEquations);
  });
});

describe('generateAllSolutions', () => {
  beforeEach(() => {
    vi.mocked(Worker).mockReset();
  });

  function createMockWorker(onPostMessage: (emitter: EventEmitter, task: any) => void | Promise<void>) {
    return function (_url: any) {
      const emitter = new EventEmitter();
      (emitter as any).terminate = vi.fn().mockResolvedValue(undefined);
      (emitter as any).postMessage = (task: any) => {
        process.nextTick(() => {
          Promise.resolve(onPostMessage(emitter, task)).catch((e) => emitter.emit('error', e));
        });
      };
      return emitter as any;
    };
  }

  function realDataWorker() {
    return createMockWorker(async (emitter, task) => {
      await generateAndWriteTempFile(task.faces, task.minTotal, task.maxTotal, task.tempPath, task.flushHighWater);
      emitter.emit('message', { faces: task.faces, success: true });
    });
  }

  it('generates correct number of face combinations', async () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.mocked(Worker).mockImplementation(realDataWorker());

    await generateAllSolutions({ outputDir: tmpDir, dieSizes: [3, 3], minTotal: 0, maxTotal: 10 });

    const shardPath = path.join(tmpDir, shardedFileName(2));
    const data = new Uint8Array(fs.readFileSync(shardPath));
    const reader = new MugbinReader(new BufferDataSource(data));
    await reader.loadIndex();

    // 2d3: C(3+1, 2) = 6 face combinations. Check each exists.
    const faceCombos = [[1,1],[1,2],[1,3],[2,2],[2,3],[3,3]];
    for (const faces of faceCombos) {
      const entries = reader.findEntries(faces);
      expect(entries.length).toBe(1);
    }

    stdoutSpy.mockRestore();
  });

  it('merges with existing mugbin file', async () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.mocked(Worker).mockImplementation(realDataWorker());

    // First run: generate 2d2 solutions.
    await generateAllSolutions({ outputDir: tmpDir, dieSizes: [2, 2], minTotal: 0, maxTotal: 10 });

    const shardPath2d = path.join(tmpDir, shardedFileName(2));
    const data1 = new Uint8Array(fs.readFileSync(shardPath2d));
    const reader1 = new MugbinReader(new BufferDataSource(data1));
    await reader1.loadIndex();
    const count1 = reader1.getIndex().length;

    // Second run: generate 2d2 again into the same directory (merges into same shard).
    await generateAllSolutions({ outputDir: tmpDir, dieSizes: [2, 2], minTotal: 0, maxTotal: 10 });

    const data2 = new Uint8Array(fs.readFileSync(shardPath2d));
    const reader2 = new MugbinReader(new BufferDataSource(data2));
    await reader2.loadIndex();
    const count2 = reader2.getIndex().length;

    // Same dice count, so merged file should have same entries (idempotent merge).
    expect(count2).toBe(count1);

    // Entries should still be queryable.
    const entries2d = reader2.findEntries([1, 2]);
    expect(entries2d.length).toBe(1);

    stdoutSpy.mockRestore();
  });

  it('errors on single die', async () => {
    await expect(
      generateAllSolutions({ outputDir: tmpDir, dieSizes: [6], minTotal: 0, maxTotal: 72 }),
    ).rejects.toThrow('At least 2 dice are required');
  });

  it('errors on die size out of range', async () => {
    await expect(
      generateAllSolutions({ outputDir: tmpDir, dieSizes: [6, 11], minTotal: 0, maxTotal: 72 }),
    ).rejects.toThrow('out of range');
  });

  it('progress output includes estimated time remaining', async () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.mocked(Worker).mockImplementation(realDataWorker());

    await generateAllSolutions({ outputDir: tmpDir, dieSizes: [2, 2], minTotal: 0, maxTotal: 10 });

    const progressCalls = stdoutSpy.mock.calls
      .map((call) => String(call[0]))
      .filter((s) => s.includes('Progress:'));
    expect(progressCalls.length).toBe(3);
    expect(progressCalls[0]).toMatch(/Progress: 1\/3/);
    expect(progressCalls[0]).toMatch(/remaining/);
    expect(progressCalls[2]).toMatch(/Progress: 3\/3/);

    stdoutSpy.mockRestore();
  });

  it('spawns a pool of workers and reuses them for all tasks', async () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    vi.mocked(Worker).mockImplementation(
      createMockWorker((emitter, task) => {
        emitter.emit('message', { faces: task.faces, success: true });
      }),
    );

    await generateAllSolutions({ outputDir: tmpDir, dieSizes: [2, 2], minTotal: 0, maxTotal: 10 });

    // 6 mocked CPUs → concurrency=3, capped at 3 face combos → 3 workers in the pool.
    expect(vi.mocked(Worker)).toHaveBeenCalledTimes(3);

    stdoutSpy.mockRestore();
  });

  it('logs errors for failed worker messages', async () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(Worker).mockImplementation(
      createMockWorker((emitter, task) => {
        emitter.emit('message', { faces: task.faces, success: false, error: 'test error' });
      }),
    );

    await generateAllSolutions({ outputDir: tmpDir, dieSizes: [2, 2], minTotal: 0, maxTotal: 10 });

    expect(consoleErrorSpy).toHaveBeenCalled();
    stdoutSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('rejects on worker error event', async () => {
    vi.mocked(Worker).mockImplementation(
      createMockWorker((emitter) => {
        emitter.emit('error', new Error('worker crashed'));
      }),
    );

    await expect(
      generateAllSolutions({ outputDir: tmpDir, dieSizes: [2, 2], minTotal: 0, maxTotal: 10 }),
    ).rejects.toThrow('worker crashed');
  });

  it('worker tasks contain faces, minTotal, and maxTotal', async () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const receivedTasks: any[] = [];

    vi.mocked(Worker).mockImplementation(
      createMockWorker((emitter, task) => {
        receivedTasks.push(task);
        emitter.emit('message', { faces: task.faces, success: true });
      }),
    );

    await generateAllSolutions({ outputDir: tmpDir, dieSizes: [2, 2], minTotal: 0, maxTotal: 10 });

    expect(receivedTasks.length).toBe(3);
    const firstTask = receivedTasks[0];
    expect(firstTask.faces).toBeDefined();
    expect(firstTask.minTotal).toBe(0);
    expect(firstTask.maxTotal).toBe(10);
    expect(firstTask.tempPath).toBeDefined();

    stdoutSpy.mockRestore();
  });

  it('logs resume message when temp files already exist', async () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(Worker).mockImplementation(realDataWorker());

    // Pre-create the temp directory with one completed temp file.
    const shardPath = path.join(tmpDir, shardedFileName(2));
    const tempDirPath = `${shardPath}.tmp`;
    fs.mkdirSync(path.dirname(shardPath), { recursive: true });
    fs.mkdirSync(tempDirPath, { recursive: true });

    // Generate a real temp file for [1,1] so it's skipped on the real run.
    const existingTempPath = path.join(tempDirPath, '1-1.mugbin');
    await generateAndWriteTempFile([1, 1], 0, 10, existingTempPath, 64 * 1024);

    await generateAllSolutions({ outputDir: tmpDir, dieSizes: [2, 2], minTotal: 0, maxTotal: 10 });

    const resumeLog = consoleLogSpy.mock.calls
      .map((call) => String(call[0]))
      .find((s) => s.includes('Resuming:'));
    expect(resumeLog).toBeDefined();
    expect(resumeLog).toMatch(/1 of 3/);

    stdoutSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});

describe('generateAndWriteTempFile', () => {
  it('writes empty marker file when no equations match', async () => {
    // faces [1,1] with minTotal=100, maxTotal=100 yields nothing.
    const tempPath = path.join(tmpDir, 'empty.mugbin');
    await generateAndWriteTempFile([1, 1], 100, 100, tempPath, 64 * 1024);

    expect(fs.existsSync(tempPath)).toBe(true);
    expect(fs.statSync(tempPath).size).toBe(0);
    // Scratch dir should be cleaned up.
    expect(fs.existsSync(tempPath + '.groups')).toBe(false);
  });

  it('triggers flushAll when total buffered data exceeds flushHighWater', async () => {
    // Using a tiny flushHighWater (1 byte) forces flushAll to be called frequently.
    const tempPath = path.join(tmpDir, 'flush-all.mugbin');
    await generateAndWriteTempFile([1, 2, 3], 0, 10, tempPath, 1);

    expect(fs.existsSync(tempPath)).toBe(true);
    expect(fs.statSync(tempPath).size).toBeGreaterThan(0);

    // Verify the resulting file is a valid mugbin.
    const data = new Uint8Array(fs.readFileSync(tempPath));
    const reader = new MugbinReader(new BufferDataSource(data));
    await reader.loadIndex();
    const entries = reader.findEntries([1, 2, 3]);
    expect(entries.length).toBe(1);
  });

  it('triggers per-group buffer flush when a single group overflows its buffer', async () => {
    // Use faces that produce many equations per group. With a large flushHighWater
    // (so flushAll is never triggered by the global threshold), the per-group buffer
    // (64KB) will fill and trigger flushGroup for individual groups.
    // [6, 6, 6, 6, 6, 6] with full range produces many equations per group, overflowing the 64KB buffer.
    const tempPath = path.join(tmpDir, 'flush-group.mugbin');
    await generateAndWriteTempFile([6, 6, 6, 6, 6, 6], 0, 500, tempPath, 1024 * 1024 * 1024);

    expect(fs.existsSync(tempPath)).toBe(true);
    expect(fs.statSync(tempPath).size).toBeGreaterThan(0);

    const data = new Uint8Array(fs.readFileSync(tempPath));
    const reader = new MugbinReader(new BufferDataSource(data));
    await reader.loadIndex();
    const entries = reader.findEntries([6, 6, 6, 6, 6, 6]);
    expect(entries.length).toBe(1);
  });

});

describe('buildSummaryEntries', () => {
  it('returns one entry per group when counts are within uint16 range', () => {
    const groups = [
      { opsMask: 1, total: 5, count: 100 },
      { opsMask: 3, total: 10, count: 65535 },
    ];
    const entries = buildSummaryEntries(groups);
    expect(entries).toEqual([
      { opsMask: 1, total: 5, count: 100 },
      { opsMask: 3, total: 10, count: 65535 },
    ]);
  });

  it('splits a group exceeding 65535 into multiple summary entries', () => {
    const groups = [
      { opsMask: 1, total: 5, count: 65536 + 10 },
    ];
    const entries = buildSummaryEntries(groups);
    expect(entries).toEqual([
      { opsMask: 1, total: 5, count: 65535 },
      { opsMask: 1, total: 5, count: 11 },
    ]);
  });

  it('splits a very large group into three or more entries', () => {
    const groups = [
      { opsMask: 7, total: 42, count: 65535 * 2 + 500 },
    ];
    const entries = buildSummaryEntries(groups);
    expect(entries).toEqual([
      { opsMask: 7, total: 42, count: 65535 },
      { opsMask: 7, total: 42, count: 65535 },
      { opsMask: 7, total: 42, count: 500 },
    ]);
  });

  it('handles mixed groups where only some exceed the limit', () => {
    const groups = [
      { opsMask: 1, total: 3, count: 100 },
      { opsMask: 2, total: 7, count: 131071 }, // 65535 * 2 + 1
      { opsMask: 4, total: 12, count: 50 },
    ];
    const entries = buildSummaryEntries(groups);
    expect(entries).toEqual([
      { opsMask: 1, total: 3, count: 100 },
      { opsMask: 2, total: 7, count: 65535 },
      { opsMask: 2, total: 7, count: 65535 },
      { opsMask: 2, total: 7, count: 1 },
      { opsMask: 4, total: 12, count: 50 },
    ]);
  });
});

describe('mergeTempMugbinFiles', () => {
  it('handles duplicate facesKey entries (sort comparator returns 0)', async () => {
    // Generate two temp files with the same face combination [1,2].
    const tempPath1 = path.join(tmpDir, 'dup1.mugbin');
    const tempPath2 = path.join(tmpDir, 'dup2.mugbin');
    await generateAndWriteTempFile([1, 2], 0, 10, tempPath1, 64 * 1024);
    await generateAndWriteTempFile([1, 2], 0, 10, tempPath2, 64 * 1024);

    const mergedPath = path.join(tmpDir, 'merged.mugbin');
    await mergeTempMugbinFiles([tempPath1, tempPath2], mergedPath);

    // The merged file should be readable and contain two index entries
    // (both for [1,2], which exercises the return 0 branch of the sort comparator).
    const data = new Uint8Array(fs.readFileSync(mergedPath));
    const reader = new MugbinReader(new BufferDataSource(data));
    await reader.loadIndex();
    expect(reader.getIndex().length).toBe(2);

    // Both entries should be for faces [1,2] and queryable.
    const entries = reader.findEntries([1, 2]);
    expect(entries.length).toBe(2);
  });
});
