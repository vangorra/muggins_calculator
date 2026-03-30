/**
 * MUGBIN binary file format v2 for precomputed Muggins solutions.
 *
 * Changes from v1:
 *   - One index entry per face combination (opsMask removed from index).
 *   - Summary entries expanded to include opsMask: (total, opsMask, count) = 5 bytes.
 *   - Index block is gzip-compressed for smaller initial fetch.
 *   - Index offsets are relative to the data section start (after header + compressed index).
 *
 * Layout:
 *   [Header: 16 bytes]
 *   [Gzip-compressed index block]
 *   [Data blocks: interleaved summary + compressed equations per entry]
 *
 * Header (16 bytes):
 *   [0-5]   Magic "MUGBIN"
 *   [6]     Format version (uint8) — currently 2
 *   [7]     DB version (uint8)
 *   [8-11]  Entry count (uint32LE)
 *   [12-15] Compressed index size in bytes (uint32LE)
 *
 * Index entry (20 bytes, gzip-compressed as a block):
 *   [0-3]   faces_key (packed 5-bit tokens, zero-padded to 4 bytes)
 *   [4]     faces_count (uint8, number of dice)
 *   [5]     reserved (uint8, zero)
 *   [6-9]   summary_offset (uint32LE, relative to data section start)
 *   [10-11] summary_length (uint16LE)
 *   [12-15] equations_offset (uint32LE, relative to data section start)
 *   [16-19] equations_length (uint32LE, compressed size)
 *
 * Summary block: array of (total: uint16LE, opsMask: uint8, count: uint16LE) entries
 *   (5 bytes each), sorted by (total, opsMask).
 *
 * Equation block: gzip-compressed flat array of packed equations,
 *   grouped in the same order as the summary entries.
 *   Each equation is packedByteLength(facesCount * 2 - 1) bytes.
 */

import { packTokens, unpackTokens, packedByteLength, DB_VERSION } from './tokens.js';

export const MUGBIN_MAGIC = 'MUGBIN';
export const MUGBIN_FORMAT_VERSION = 2;
export const HEADER_SIZE = 16;
export const INDEX_ENTRY_SIZE = 20;
export const SUMMARY_ENTRY_SIZE = 5;
export const FACES_KEY_SIZE = 4;

export interface MugbinSummaryEntry {
  readonly total: number;
  readonly opsMask: number;
  readonly count: number;
}

export interface MugbinIndexEntry {
  readonly facesKey: Uint8Array;
  readonly facesCount: number;
  readonly summaryOffset: number;
  readonly summaryLength: number;
  readonly equationsOffset: number;
  readonly equationsLength: number;
}

export interface MugbinDataSource {
  readBytes(offset: number, length: number): Promise<Uint8Array>;
}

// --- Compression helpers ---

export async function gzipCompress(data: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream !== 'undefined') {
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(data as any);
    writer.close();
    return collectStream(cs.readable);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const zlib: any = await Function('return import("node:zlib")')();
  return new Uint8Array(zlib.gzipSync(data));
}

export async function gzipDecompress(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(data as any);
    writer.close();
    return collectStream(ds.readable);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const zlib: any = await Function('return import("node:zlib")')();
  return new Uint8Array(zlib.gunzipSync(data));
}

async function collectStream(readable: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = readable.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

// --- Shared helpers ---

function facesKeyPadded(faces: number[]): Uint8Array {
  const sortedFaces = [...faces].sort((a, b) => a - b);
  const packed = packTokens(sortedFaces);
  const padded = new Uint8Array(FACES_KEY_SIZE);
  padded.set(packed);
  return padded;
}

function facesKeyHex(facesKey: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < facesKey.length; i++) {
    hex += facesKey[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// --- Writer ---

interface WriterSummaryGroup {
  summary: MugbinSummaryEntry;
  equationChunk: Uint8Array;
}

interface WriterEntry {
  facesKey: Uint8Array;
  facesCount: number;
  groups: WriterSummaryGroup[];
  preCompressed?: Uint8Array;
}

export class MugbinWriter {
  private entries = new Map<string, WriterEntry>();

  /**
   * Add equations for a (faces, opsMask, total) grouping.
   * Entries are keyed by faces only; opsMask is stored in each summary entry.
   */
  addEquations(
    faces: number[],
    opsMask: number,
    total: number,
    packedEquations: Uint8Array,
    count: number,
  ): void {
    const facesKey = facesKeyPadded(faces);
    const entryKey = facesKeyHex(facesKey);

    let entry = this.entries.get(entryKey);
    if (!entry) {
      entry = {
        facesKey,
        facesCount: [...faces].length,
        groups: [],
      };
      this.entries.set(entryKey, entry);
    }

    entry.groups.push({
      summary: { total, opsMask, count },
      equationChunk: packedEquations,
    });
  }

  /**
   * Import all entries from an existing mugbin file via a MugbinReader.
   * Copies raw summary and compressed equation data without re-compressing.
   */
  async loadFrom(reader: MugbinReader, source: MugbinDataSource): Promise<void> {
    const index = reader.getIndex();

    for (const indexEntry of index) {
      const facesKey = indexEntry.facesKey;
      const entryKey = facesKeyHex(facesKey);

      if (this.entries.has(entryKey)) continue;

      const summaryBytes = await source.readBytes(
        indexEntry.summaryOffset,
        indexEntry.summaryLength,
      );
      const summaryView = new DataView(
        summaryBytes.buffer,
        summaryBytes.byteOffset,
        summaryBytes.byteLength,
      );
      const summaries: MugbinSummaryEntry[] = [];
      for (let i = 0; i < summaryBytes.length; i += SUMMARY_ENTRY_SIZE) {
        summaries.push({
          total: summaryView.getUint16(i, true),
          opsMask: summaryView.getUint8(i + 2),
          count: summaryView.getUint16(i + 3, true),
        });
      }

      const compressedEquations = await source.readBytes(
        indexEntry.equationsOffset,
        indexEntry.equationsLength,
      );

      this.entries.set(entryKey, {
        facesKey: new Uint8Array(facesKey),
        facesCount: indexEntry.facesCount,
        groups: summaries.map((s) => ({ summary: s, equationChunk: new Uint8Array(0) })),
        preCompressed: compressedEquations,
      });
    }
  }

  /** Build the complete .mugbin file. */
  async build(): Promise<Uint8Array> {
    // Sort entries by facesKey bytes.
    const sortedEntries = [...this.entries.values()].sort((a, b) => {
      for (let i = 0; i < FACES_KEY_SIZE; i++) {
        if (a.facesKey[i] !== b.facesKey[i]) return a.facesKey[i] - b.facesKey[i];
      }
      return 0;
    });

    // Sort groups within each entry by (total, opsMask) so summaries and equations are aligned.
    for (const entry of sortedEntries) {
      entry.groups.sort((a, b) =>
        a.summary.total - b.summary.total || a.summary.opsMask - b.summary.opsMask,
      );
    }

    // Compress equation blocks.
    const compressedBlocks: Uint8Array[] = [];
    for (const entry of sortedEntries) {
      if (entry.preCompressed) {
        compressedBlocks.push(entry.preCompressed);
      } else {
        const chunks = entry.groups.map((g) => g.equationChunk);
        const totalBytes = chunks.reduce((sum, c) => sum + c.length, 0);
        const raw = concatenateChunks(chunks, totalBytes);
        compressedBlocks.push(await gzipCompress(raw));
      }
    }

    // Compute data layout with offsets relative to data section start.
    const entryCount = sortedEntries.length;
    let relativeOffset = 0;
    const layout: {
      summaryOffset: number;
      summaryLength: number;
      equationsOffset: number;
      equationsLength: number;
    }[] = [];

    for (let i = 0; i < entryCount; i++) {
      const summaryLength = sortedEntries[i].groups.length * SUMMARY_ENTRY_SIZE;
      const equationsLength = compressedBlocks[i].length;
      layout.push({
        summaryOffset: relativeOffset,
        summaryLength,
        equationsOffset: relativeOffset + summaryLength,
        equationsLength,
      });
      relativeOffset += summaryLength + equationsLength;
    }
    const totalDataSize = relativeOffset;

    // Build raw index with relative offsets.
    const rawIndexSize = entryCount * INDEX_ENTRY_SIZE;
    const rawIndex = new Uint8Array(rawIndexSize);
    const rawIndexView = new DataView(rawIndex.buffer);

    for (let i = 0; i < entryCount; i++) {
      const entry = sortedEntries[i];
      const l = layout[i];
      const off = i * INDEX_ENTRY_SIZE;
      rawIndex.set(entry.facesKey, off);
      rawIndexView.setUint8(off + 4, entry.facesCount);
      rawIndexView.setUint8(off + 5, 0); // reserved
      rawIndexView.setUint32(off + 6, l.summaryOffset, true);
      rawIndexView.setUint16(off + 10, l.summaryLength, true);
      rawIndexView.setUint32(off + 12, l.equationsOffset, true);
      rawIndexView.setUint32(off + 16, l.equationsLength, true);
    }

    // Compress the index.
    const compressedIndex = await gzipCompress(rawIndex);
    const dataStart = HEADER_SIZE + compressedIndex.length;

    // Build file.
    const totalSize = dataStart + totalDataSize;
    const buffer = new Uint8Array(totalSize);
    const view = new DataView(buffer.buffer);

    // Header.
    const magic = new TextEncoder().encode(MUGBIN_MAGIC);
    buffer.set(magic, 0);
    view.setUint8(6, MUGBIN_FORMAT_VERSION);
    view.setUint8(7, DB_VERSION);
    view.setUint32(8, entryCount, true);
    view.setUint32(12, compressedIndex.length, true);

    // Compressed index.
    buffer.set(compressedIndex, HEADER_SIZE);

    // Data blocks.
    for (let i = 0; i < entryCount; i++) {
      const entry = sortedEntries[i];
      const l = layout[i];

      // Write summary.
      let pos = dataStart + l.summaryOffset;
      for (const g of entry.groups) {
        view.setUint16(pos, g.summary.total, true);
        view.setUint8(pos + 2, g.summary.opsMask);
        view.setUint16(pos + 3, g.summary.count, true);
        pos += SUMMARY_ENTRY_SIZE;
      }

      // Write compressed equations.
      buffer.set(compressedBlocks[i], dataStart + l.equationsOffset);
    }

    return buffer;
  }
}

function concatenateChunks(chunks: Uint8Array[], totalBytes: number): Uint8Array {
  if (chunks.length === 1) return chunks[0];
  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

// --- Reader ---

export class MugbinReader {
  private source: MugbinDataSource;
  private index: MugbinIndexEntry[] | null = null;
  private dbVersion = 0;

  constructor(source: MugbinDataSource) {
    this.source = source;
  }

  /** Load the header and full index from the data source. */
  async loadIndex(): Promise<void> {
    const headerBytes = await this.source.readBytes(0, HEADER_SIZE);
    const headerView = new DataView(
      headerBytes.buffer,
      headerBytes.byteOffset,
      headerBytes.byteLength,
    );

    const magic = new TextDecoder().decode(headerBytes.slice(0, 6));
    if (magic !== MUGBIN_MAGIC) {
      throw new Error(`Invalid mugbin file: expected magic "${MUGBIN_MAGIC}", got "${magic}"`);
    }

    const formatVersion = headerView.getUint8(6);
    if (formatVersion !== MUGBIN_FORMAT_VERSION) {
      throw new Error(`Unsupported mugbin format version ${formatVersion}`);
    }

    this.dbVersion = headerView.getUint8(7);
    const entryCount = headerView.getUint32(8, true);
    const compressedIndexSize = headerView.getUint32(12, true);

    // Read and decompress the index.
    const compressedIndexBytes = await this.source.readBytes(HEADER_SIZE, compressedIndexSize);
    const indexBytes = await gzipDecompress(compressedIndexBytes);

    const indexView = new DataView(
      indexBytes.buffer,
      indexBytes.byteOffset,
      indexBytes.byteLength,
    );

    // Compute data section start for converting relative offsets to absolute.
    const dataStart = HEADER_SIZE + compressedIndexSize;

    this.index = [];
    for (let i = 0; i < entryCount; i++) {
      const off = i * INDEX_ENTRY_SIZE;
      this.index.push({
        facesKey: indexBytes.slice(off, off + FACES_KEY_SIZE),
        facesCount: indexView.getUint8(off + 4),
        summaryOffset: dataStart + indexView.getUint32(off + 6, true),
        summaryLength: indexView.getUint16(off + 10, true),
        equationsOffset: dataStart + indexView.getUint32(off + 12, true),
        equationsLength: indexView.getUint32(off + 16, true),
      });
    }
  }

  getDbVersion(): number {
    return this.dbVersion;
  }

  /** Return the loaded index entries. Throws if loadIndex() has not been called. */
  getIndex(): readonly MugbinIndexEntry[] {
    if (!this.index) throw new Error('Index not loaded. Call loadIndex() first.');
    return this.index;
  }

  /**
   * Find all index entries matching the given faces.
   * In v2, there is one entry per face combination (no opsMask in index).
   */
  findEntries(faces: number[], _opsMask?: number): MugbinIndexEntry[] {
    if (!this.index) throw new Error('Index not loaded. Call loadIndex() first.');

    const facesKey = facesKeyPadded(faces);
    const facesCount = faces.length;

    return this.index.filter((entry) => {
      if (entry.facesCount !== facesCount) return false;
      for (let i = 0; i < FACES_KEY_SIZE; i++) {
        if (entry.facesKey[i] !== facesKey[i]) return false;
      }
      return true;
    });
  }

  /** Parse a summary block from raw bytes. */
  parseSummary(bytes: Uint8Array): MugbinSummaryEntry[] {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const entries: MugbinSummaryEntry[] = [];
    for (let i = 0; i < bytes.length; i += SUMMARY_ENTRY_SIZE) {
      entries.push({
        total: view.getUint16(i, true),
        opsMask: view.getUint8(i + 2),
        count: view.getUint16(i + 3, true),
      });
    }
    return entries;
  }

  /**
   * Fetch and aggregate jump data (total → count) for the given index entries.
   * Filters by opsMask: only counts summary entries whose opsMask is a subset.
   */
  async getJumpData(
    entries: MugbinIndexEntry[],
    opsMask: number,
    onProgress?: (completed: number, total: number) => void,
  ): Promise<Map<number, number>> {
    const result = new Map<number, number>();
    let completed = 0;

    onProgress?.(0, entries.length);

    const summaryPromises = entries.map(async (entry) => {
      if (entry.summaryLength === 0) return;
      const bytes = await this.source.readBytes(entry.summaryOffset, entry.summaryLength);
      const summaries = this.parseSummary(bytes);
      for (const { total, opsMask: entryOpsMask, count } of summaries) {
        if ((entryOpsMask & ~opsMask) === 0) {
          result.set(total, (result.get(total) ?? 0) + count);
        }
      }
      completed++;
      onProgress?.(completed, entries.length);
    });

    await Promise.all(summaryPromises);
    return result;
  }

  /**
   * Fetch equations for a specific total from the given index entries.
   * Filters by opsMask: only returns equations from matching summary entries.
   */
  async getEquationsForTotal(
    entries: MugbinIndexEntry[],
    targetTotal: number,
    opsMask: number,
  ): Promise<{ postfixTokens: number[] }[]> {
    const results: { postfixTokens: number[] }[] = [];

    const promises = entries.map(async (entry) => {
      const summaryBytes = await this.source.readBytes(
        entry.summaryOffset,
        entry.summaryLength,
      );
      const summaries = this.parseSummary(summaryBytes);

      const tokenCount = entry.facesCount * 2 - 1;
      const eqByteLen = packedByteLength(tokenCount);

      // Walk summaries to find byte offsets for matching slices.
      let equationByteOffset = 0;
      const matchingSlices: { offset: number; count: number }[] = [];

      for (const s of summaries) {
        if (s.total === targetTotal && (s.opsMask & ~opsMask) === 0) {
          matchingSlices.push({ offset: equationByteOffset, count: s.count });
        }
        equationByteOffset += s.count * eqByteLen;
      }

      if (matchingSlices.length === 0) return [];

      const compressedBytes = await this.source.readBytes(
        entry.equationsOffset,
        entry.equationsLength,
      );
      const decompressed = await gzipDecompress(compressedBytes);

      const entryResults: { postfixTokens: number[] }[] = [];
      for (const slice of matchingSlices) {
        for (let i = 0; i < slice.count; i++) {
          const offset = slice.offset + i * eqByteLen;
          const packed = decompressed.slice(offset, offset + eqByteLen);
          entryResults.push({ postfixTokens: unpackTokens(packed, tokenCount) });
        }
      }
      return entryResults;
    });

    const allResults = await Promise.all(promises);
    for (const r of allResults) {
      results.push(...r);
    }

    return results;
  }
}

/**
 * MugbinDataSource backed by an in-memory Uint8Array.
 * Useful for testing and for reading files loaded entirely into memory.
 */
export class BufferDataSource implements MugbinDataSource {
  constructor(private data: Uint8Array) {}

  async readBytes(offset: number, length: number): Promise<Uint8Array> {
    return this.data.slice(offset, offset + length);
  }
}
