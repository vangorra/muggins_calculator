import { describe, it, expect } from 'vitest';
import {
  MugbinWriter,
  MugbinReader,
  BufferDataSource,
  MUGBIN_MAGIC,
  MUGBIN_FORMAT_VERSION,
  gzipCompress,
  gzipDecompress,
} from './mugbin.js';
import { packTokens, DB_VERSION } from './tokens.js';

describe('mugbin', () => {
  describe('gzip round-trip', () => {
    it('compresses and decompresses data', async () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const compressed = await gzipCompress(original);
      const decompressed = await gzipDecompress(compressed);
      expect(decompressed).toEqual(original);
    });

    it('handles empty data', async () => {
      const original = new Uint8Array(0);
      const compressed = await gzipCompress(original);
      const decompressed = await gzipDecompress(compressed);
      expect(decompressed).toEqual(original);
    });
  });

  describe('MugbinWriter and MugbinReader round-trip', () => {
    it('writes and reads a single entry', async () => {
      const writer = new MugbinWriter();
      const faces = [1, 2, 3];
      const opsMask = 1; // plus only

      // Two equations for total=6: "1 2 + 3 +" and "1 3 + 2 +"
      const tokens1 = [1, 2, 25, 3, 25]; // 1 2 + 3 +
      const tokens2 = [1, 3, 25, 2, 25]; // 1 3 + 2 +
      const packed1 = packTokens(tokens1);
      const packed2 = packTokens(tokens2);
      const eqByteLen = packed1.length;
      const combined = new Uint8Array(eqByteLen * 2);
      combined.set(packed1, 0);
      combined.set(packed2, eqByteLen);

      writer.addEquations(faces, opsMask, 6, combined, 2);

      const fileData = await writer.build();

      // Verify header.
      const magic = new TextDecoder().decode(fileData.slice(0, 6));
      expect(magic).toBe(MUGBIN_MAGIC);
      expect(fileData[6]).toBe(MUGBIN_FORMAT_VERSION);
      expect(fileData[7]).toBe(DB_VERSION);
      const view = new DataView(fileData.buffer);
      expect(view.getUint32(8, true)).toBe(1); // 1 entry

      // Read back.
      const reader = new MugbinReader(new BufferDataSource(fileData));
      await reader.loadIndex();

      expect(reader.getDbVersion()).toBe(DB_VERSION);

      const entries = reader.findEntries(faces);
      expect(entries.length).toBe(1);
      expect(entries[0].facesCount).toBe(3);

      // Jump data with opsMask filter.
      const jumpData = await reader.getJumpData(entries, opsMask);
      expect(jumpData.get(6)).toBe(2);
      expect(jumpData.size).toBe(1);

      // Equations for total.
      const equations = await reader.getEquationsForTotal(entries, 6, opsMask);
      expect(equations.length).toBe(2);
      expect(equations[0].postfixTokens).toEqual(tokens1);
      expect(equations[1].postfixTokens).toEqual(tokens2);
    });

    it('writes and reads multiple ops for the same faces', async () => {
      const writer = new MugbinWriter();

      // faces [1,2], plus (mask=1), total=3: "1 2 +"
      const tokens1 = [1, 2, 25];
      writer.addEquations([1, 2], 1, 3, packTokens(tokens1), 1);

      // faces [1,2], minus (mask=2), total=1: "2 1 -"
      const tokensMinus = [2, 1, 26];
      writer.addEquations([1, 2], 2, 1, packTokens(tokensMinus), 1);

      // faces [3,4], multiply (mask=4), total=12: "3 4 *"
      const tokensMul = [3, 4, 27];
      writer.addEquations([3, 4], 4, 12, packTokens(tokensMul), 1);

      const fileData = await writer.build();
      const reader = new MugbinReader(new BufferDataSource(fileData));
      await reader.loadIndex();

      // In v2, faces [1,2] has ONE index entry containing both ops.
      const entries12 = reader.findEntries([1, 2]);
      expect(entries12.length).toBe(1);

      // Jump data with plus+minus (mask=3): sees both.
      const jumpData12 = await reader.getJumpData(entries12, 3);
      expect(jumpData12.get(3)).toBe(1); // from plus
      expect(jumpData12.get(1)).toBe(1); // from minus

      // Jump data with only plus (mask=1): filters out minus.
      const jumpDataPlus = await reader.getJumpData(entries12, 1);
      expect(jumpDataPlus.get(3)).toBe(1);
      expect(jumpDataPlus.has(1)).toBe(false);

      // faces [3,4] with multiply.
      const entries34 = reader.findEntries([3, 4]);
      expect(entries34.length).toBe(1);
      const jumpData34 = await reader.getJumpData(entries34, 4);
      expect(jumpData34.get(12)).toBe(1);

      const eqs34 = await reader.getEquationsForTotal(entries34, 12, 4);
      expect(eqs34.length).toBe(1);
      expect(eqs34[0].postfixTokens).toEqual(tokensMul);

      // Non-existent faces.
      const entriesNone = reader.findEntries([5, 6]);
      expect(entriesNone.length).toBe(0);
    });

    it('handles multiple totals within a single entry', async () => {
      const writer = new MugbinWriter();

      // faces [2,3], plus (mask=1), total=5: "2 3 +"
      const tokens5 = [2, 3, 25];
      writer.addEquations([2, 3], 1, 5, packTokens(tokens5), 1);

      // faces [2,3], plus (mask=1), total=6
      const tokens6 = [3, 3, 25]; // hypothetical
      writer.addEquations([2, 3], 1, 6, packTokens(tokens6), 1);

      const fileData = await writer.build();
      const reader = new MugbinReader(new BufferDataSource(fileData));
      await reader.loadIndex();

      const entries = reader.findEntries([2, 3]);
      expect(entries.length).toBe(1);

      const jumpData = await reader.getJumpData(entries, 1);
      expect(jumpData.get(5)).toBe(1);
      expect(jumpData.get(6)).toBe(1);
      expect(jumpData.size).toBe(2);

      // Get equations for total=5 only.
      const eqs5 = await reader.getEquationsForTotal(entries, 5, 1);
      expect(eqs5.length).toBe(1);
      expect(eqs5[0].postfixTokens).toEqual(tokens5);

      // Get equations for total=6 only.
      const eqs6 = await reader.getEquationsForTotal(entries, 6, 1);
      expect(eqs6.length).toBe(1);
      expect(eqs6[0].postfixTokens).toEqual(tokens6);

      // Non-existent total.
      const eqsNone = await reader.getEquationsForTotal(entries, 99, 1);
      expect(eqsNone.length).toBe(0);
    });

    it('opsMask filtering in jump data works correctly', async () => {
      const writer = new MugbinWriter();
      const tokens = [1, 2, 25]; // 1 2 +
      const packed = packTokens(tokens);

      // Entry with plus+minus (mask=3) for total=3
      writer.addEquations([1, 2], 3, 3, packed, 1);

      // Entry with plus only (mask=1) for total=3
      writer.addEquations([1, 2], 1, 3, packed, 1);

      // Entry with multiply only (mask=4) for total=2
      writer.addEquations([1, 2], 4, 2, packed, 1);

      const fileData = await writer.build();
      const reader = new MugbinReader(new BufferDataSource(fileData));
      await reader.loadIndex();

      // All in one index entry.
      const entries = reader.findEntries([1, 2]);
      expect(entries.length).toBe(1);

      // With plus only (mask=1): only mask=1 summary matches.
      const jdPlus = await reader.getJumpData(entries, 1);
      expect(jdPlus.get(3)).toBe(1);
      expect(jdPlus.has(2)).toBe(false);

      // With plus+minus (mask=3): mask=1 and mask=3 match.
      const jdPlusMinus = await reader.getJumpData(entries, 3);
      expect(jdPlusMinus.get(3)).toBe(2);

      // With all basic ops (mask=15): all three match.
      const jdAll = await reader.getJumpData(entries, 15);
      expect(jdAll.get(3)).toBe(2);
      expect(jdAll.get(2)).toBe(1);

      // With multiply only (mask=4): only mask=4 matches.
      const jdMul = await reader.getJumpData(entries, 4);
      expect(jdMul.get(2)).toBe(1);
      expect(jdMul.has(3)).toBe(false);
    });

    it('opsMask filtering in getEquationsForTotal works correctly', async () => {
      const writer = new MugbinWriter();
      const tokensPlus = [1, 2, 25]; // 1 2 +
      const tokensMul = [1, 2, 27]; // 1 2 *

      // Both produce total=3 but different ops.
      writer.addEquations([1, 2], 1, 3, packTokens(tokensPlus), 1); // plus only
      writer.addEquations([1, 2], 4, 3, packTokens(tokensMul), 1); // multiply only

      const fileData = await writer.build();
      const reader = new MugbinReader(new BufferDataSource(fileData));
      await reader.loadIndex();

      const entries = reader.findEntries([1, 2]);

      // With plus only: returns only plus equation.
      const eqsPlus = await reader.getEquationsForTotal(entries, 3, 1);
      expect(eqsPlus.length).toBe(1);
      expect(eqsPlus[0].postfixTokens).toEqual(tokensPlus);

      // With multiply only: returns only multiply equation.
      const eqsMul = await reader.getEquationsForTotal(entries, 3, 4);
      expect(eqsMul.length).toBe(1);
      expect(eqsMul[0].postfixTokens).toEqual(tokensMul);

      // With both: returns both equations.
      const eqsBoth = await reader.getEquationsForTotal(entries, 3, 5);
      expect(eqsBoth.length).toBe(2);
    });

    it('jump data progress callback is invoked', async () => {
      const writer = new MugbinWriter();
      writer.addEquations([1, 2], 1, 3, packTokens([1, 2, 25]), 1);
      writer.addEquations([3, 4], 2, 1, packTokens([4, 3, 26]), 1);

      const fileData = await writer.build();
      const reader = new MugbinReader(new BufferDataSource(fileData));
      await reader.loadIndex();

      // Two separate face entries.
      const entries = reader.getIndex();
      const progressCalls: [number, number][] = [];
      await reader.getJumpData([...entries], 0x7f, (completed, total) => {
        progressCalls.push([completed, total]);
      });

      expect(progressCalls[0]).toEqual([0, 2]);
      expect(progressCalls.length).toBeGreaterThan(1);
    });

    it('reader throws on invalid magic', async () => {
      const bad = new Uint8Array(32);
      bad.set(new TextEncoder().encode('BADMAG'), 0);
      const reader = new MugbinReader(new BufferDataSource(bad));
      await expect(reader.loadIndex()).rejects.toThrow('Invalid mugbin file');
    });

    it('reader throws on unsupported format version', async () => {
      const bad = new Uint8Array(32);
      bad.set(new TextEncoder().encode(MUGBIN_MAGIC), 0);
      bad[6] = 99; // unsupported version
      const reader = new MugbinReader(new BufferDataSource(bad));
      await expect(reader.loadIndex()).rejects.toThrow('Unsupported mugbin format version');
    });

    it('reader throws when index not loaded', () => {
      const reader = new MugbinReader(new BufferDataSource(new Uint8Array(0)));
      expect(() => reader.findEntries([1, 2])).toThrow('Index not loaded');
    });

    it('handles 4 and 5 dice face keys', async () => {
      const writer = new MugbinWriter();

      // 4 dice
      const faces4 = [1, 2, 3, 4];
      const postfix4 = [1, 2, 25, 3, 25, 4, 25]; // 1 2 + 3 + 4 +
      writer.addEquations(faces4, 1, 10, packTokens(postfix4), 1);

      // 5 dice
      const faces5 = [1, 2, 3, 4, 5];
      const postfix5 = [1, 2, 25, 3, 25, 4, 25, 5, 25]; // 1 2 + 3 + 4 + 5 +
      writer.addEquations(faces5, 1, 15, packTokens(postfix5), 1);

      const fileData = await writer.build();
      const reader = new MugbinReader(new BufferDataSource(fileData));
      await reader.loadIndex();

      // 4 dice lookup
      const entries4 = reader.findEntries(faces4);
      expect(entries4.length).toBe(1);
      expect(entries4[0].facesCount).toBe(4);
      const eqs4 = await reader.getEquationsForTotal(entries4, 10, 1);
      expect(eqs4.length).toBe(1);
      expect(eqs4[0].postfixTokens).toEqual(postfix4);

      // 5 dice lookup
      const entries5 = reader.findEntries(faces5);
      expect(entries5.length).toBe(1);
      expect(entries5[0].facesCount).toBe(5);
      const eqs5 = await reader.getEquationsForTotal(entries5, 15, 1);
      expect(eqs5.length).toBe(1);
      expect(eqs5[0].postfixTokens).toEqual(postfix5);

      // Cross-lookup should not match
      expect(reader.findEntries([1, 2, 3]).length).toBe(0);
    });

    it('loadFrom merges existing entries with new ones', async () => {
      // Build file 1: faces [1,2], plus (mask=1), total=3
      const writer1 = new MugbinWriter();
      const tokens1 = [1, 2, 25]; // 1 2 +
      writer1.addEquations([1, 2], 1, 3, packTokens(tokens1), 1);
      const file1 = await writer1.build();

      // Build file 2: start from file 1, add faces [3,4], multiply (mask=4), total=12
      const writer2 = new MugbinWriter();
      const source1 = new BufferDataSource(file1);
      const reader1 = new MugbinReader(source1);
      await reader1.loadIndex();
      await writer2.loadFrom(reader1, source1);

      const tokens2 = [3, 4, 27]; // 3 4 *
      writer2.addEquations([3, 4], 4, 12, packTokens(tokens2), 1);

      const file2 = await writer2.build();

      // Verify merged file has both entries.
      const reader2 = new MugbinReader(new BufferDataSource(file2));
      await reader2.loadIndex();

      // Original entry still works.
      const entries12 = reader2.findEntries([1, 2]);
      expect(entries12.length).toBe(1);
      const jumpData12 = await reader2.getJumpData(entries12, 1);
      expect(jumpData12.get(3)).toBe(1);
      const eqs12 = await reader2.getEquationsForTotal(entries12, 3, 1);
      expect(eqs12.length).toBe(1);
      expect(eqs12[0].postfixTokens).toEqual(tokens1);

      // New entry also works.
      const entries34 = reader2.findEntries([3, 4]);
      expect(entries34.length).toBe(1);
      const jumpData34 = await reader2.getJumpData(entries34, 4);
      expect(jumpData34.get(12)).toBe(1);
      const eqs34 = await reader2.getEquationsForTotal(entries34, 12, 4);
      expect(eqs34.length).toBe(1);
      expect(eqs34[0].postfixTokens).toEqual(tokens2);
    });

    it('loadFrom does not overwrite new entries with existing ones', async () => {
      // Build file with faces [1,2], plus (mask=1), total=3, 1 equation
      const writer1 = new MugbinWriter();
      writer1.addEquations([1, 2], 1, 3, packTokens([1, 2, 25]), 1);
      const file1 = await writer1.build();

      // Writer 2: add same faces with different data FIRST, then loadFrom
      const writer2 = new MugbinWriter();
      const newTokens = [2, 1, 25]; // 2 1 + (different equation, same total)
      writer2.addEquations([1, 2], 1, 3, packTokens(newTokens), 1);

      const source1 = new BufferDataSource(file1);
      const reader1 = new MugbinReader(source1);
      await reader1.loadIndex();
      await writer2.loadFrom(reader1, source1);

      const file2 = await writer2.build();
      const reader2 = new MugbinReader(new BufferDataSource(file2));
      await reader2.loadIndex();

      // The new data should win (loadFrom skips existing keys).
      const eqs = await reader2.getEquationsForTotal(reader2.findEntries([1, 2]), 3, 1);
      expect(eqs.length).toBe(1);
      expect(eqs[0].postfixTokens).toEqual(newTokens);
    });

    it('getIndex returns loaded index entries', async () => {
      const writer = new MugbinWriter();
      writer.addEquations([1, 2], 1, 3, packTokens([1, 2, 25]), 1);
      writer.addEquations([3, 4], 4, 12, packTokens([3, 4, 27]), 1);

      const fileData = await writer.build();
      const reader = new MugbinReader(new BufferDataSource(fileData));
      await reader.loadIndex();

      const index = reader.getIndex();
      expect(index.length).toBe(2);
      expect(index[0].facesCount).toBeGreaterThanOrEqual(2);
    });

    it('getIndex throws when index not loaded', () => {
      const reader = new MugbinReader(new BufferDataSource(new Uint8Array(0)));
      expect(() => reader.getIndex()).toThrow('Index not loaded');
    });

    it('compressed index is smaller than raw index', async () => {
      const writer = new MugbinWriter();
      // Add many entries to make compression effective.
      for (let i = 1; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
          writer.addEquations([i, j], 1, i + j, packTokens([i, j, 25]), 1);
        }
      }

      const fileData = await writer.build();
      const view = new DataView(fileData.buffer);
      const entryCount = view.getUint32(8, true);
      const compressedIndexSize = view.getUint32(12, true);
      const rawIndexSize = entryCount * 20; // INDEX_ENTRY_SIZE

      expect(compressedIndexSize).toBeLessThan(rawIndexSize);
    });
  });
});
