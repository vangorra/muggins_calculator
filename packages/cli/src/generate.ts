import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { Worker } from 'node:worker_threads';
import {
  generateResults,
  generateFaceCombinations,
  OPERATIONS_LIST,
  packTokens,
  packedByteLength,
  isOperationToken,
  OPERATION_TO_TOKEN,
  OPERATION_MASKS,
  OperationEnum,
  MIN_FACE_VALUE,
  MAX_FACE_VALUE,
  MugbinWriter,
  MugbinReader,
  BufferDataSource,
  MUGBIN_FORMAT_VERSION,
  MUGBIN_MAGIC,
  HEADER_SIZE,
  INDEX_ENTRY_SIZE,
  SUMMARY_ENTRY_SIZE,
  FACES_KEY_SIZE,
  gzipCompress,
  DB_VERSION,
} from '@muggins_calculator/common';

export function formatTimeRemaining(msPerItem: number, remaining: number): string {
  if (msPerItem <= 0 || remaining <= 0) return '';
  const remainingMs = msPerItem * remaining;
  let totalSeconds = Math.ceil(remainingMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0 || seconds > 0) parts.push(`${seconds}s`);
  return `~${parts.join(' ')} remaining`;
}

/** Map from 5-bit operation token to its bitmask value. */
const TOKEN_TO_MASK: Record<number, number> = Object.fromEntries(
  (Object.entries(OPERATION_TO_TOKEN) as [OperationEnum, number][]).map(([name, token]) => [token, OPERATION_MASKS[name]]),
);

function postfixTokensToMask(postfixTokens: number[]): number {
  let mask = 0;
  for (const token of postfixTokens) {
    if (isOperationToken(token)) {
      mask |= TOKEN_TO_MASK[token];
    }
  }
  return mask;
}

/** Result of generating solutions for a single face combination. */
export interface GeneratedFaceData {
  readonly faces: number[];
  readonly groups: GeneratedGroup[];
}

export interface GeneratedGroup {
  readonly opsMask: number;
  readonly total: number;
  readonly packedEquations: Uint8Array;
  readonly count: number;
}

/**
 * Generate all solutions for a single face combination.
 * Returns grouped data ready to be added to a MugbinWriter.
 */
export function generateSolutionsData(
  faces: number[],
  minTotal: number,
  maxTotal: number,
): GeneratedFaceData {
  const sortedFaces = [...faces].sort((a, b) => a - b);
  const diceCount = sortedFaces.length;
  const tokenCount = diceCount * 2 - 1;
  const equationLength = packedByteLength(tokenCount);
  const allOperations = OPERATIONS_LIST.map((op) => op.id);

  const grouped = new Map<string, Uint8Array[]>();

  for (const { total, postfixTokens } of generateResults(
    { faces: sortedFaces, operations: allOperations, minTotal, maxTotal },
  )) {
    const opsMask = postfixTokensToMask(postfixTokens);
    const key = `${opsMask}:${total}`;
    let packedList = grouped.get(key);
    if (!packedList) {
      packedList = [];
      grouped.set(key, packedList);
    }
    packedList.push(packTokens(postfixTokens));
  }

  const groups: GeneratedGroup[] = [];
  for (const [key, packedList] of grouped) {
    const [opsMaskStr, totalStr] = key.split(':');
    const opsMask = parseInt(opsMaskStr, 10);
    const total = parseInt(totalStr, 10);

    const packedEquations = new Uint8Array(packedList.length * equationLength);
    for (let i = 0; i < packedList.length; i++) {
      packedEquations.set(packedList[i], i * equationLength);
    }

    groups.push({ opsMask, total, packedEquations, count: packedList.length });
  }

  return { faces: sortedFaces, groups };
}

export interface GenerateSolutionsOptions {
  readonly outputPath: string;
  readonly faces: number[];
  readonly minTotal: number;
  readonly maxTotal: number;
}

/** Generate solutions for a single face combination and write a .mugbin file. */
export async function generateSolutions(options: GenerateSolutionsOptions): Promise<void> {
  const { outputPath, faces, minTotal, maxTotal } = options;
  const writer = new MugbinWriter();
  const data = generateSolutionsData(faces, minTotal, maxTotal);

  for (const group of data.groups) {
    writer.addEquations(data.faces, group.opsMask, group.total, group.packedEquations, group.count);
  }

  const mugbinData = await writer.build();
  fs.writeFileSync(outputPath, mugbinData);
}

export interface GenerateAllSolutionsOptions {
  readonly outputDir: string;
  readonly dieSizes: number[];
  readonly minTotal: number;
  readonly maxTotal: number;
  /** Number of parallel workers. Defaults to cpus-2; capped at cpus-1 to keep one thread free for cancellation. */
  readonly concurrency?: number;
}

export interface WorkerTask {
  readonly faces: number[];
  readonly minTotal: number;
  readonly maxTotal: number;
  readonly tempPath: string;
  /** Maximum bytes of buffered write data before flushing to disk. */
  readonly flushHighWater: number;
}

export interface WorkerResult {
  readonly faces: number[];
  readonly success: boolean;
  readonly error?: string;
}


/** Compute the sharded output filename for a given dice count. */
export function shardedFileName(diceCount: number): string {
  return `solutions-${diceCount}d.mugbin`;
}

/** Path to the temp file for a specific face combination. */
function tempFilePath(tempDir: string, faces: number[]): string {
  return path.join(tempDir, faces.join('-') + '.mugbin');
}

/**
 * Stream the equation data from per-group scratch files through a single gzip compressor.
 * Each group's file is piped in sorted order so the compressed block matches the summary ordering.
 */
async function streamCompressGroupFiles(
  sortedGroups: ReadonlyArray<{ scratchPath: string }>,
): Promise<Buffer> {
  const gzip = zlib.createGzip();
  const chunks: Buffer[] = [];

  const endPromise = new Promise<void>((resolve, reject) => {
    gzip.on('data', (chunk: Buffer) => chunks.push(chunk));
    gzip.on('end', resolve);
    gzip.on('error', reject);
  });

  for (const g of sortedGroups) {
    const readStream = fs.createReadStream(g.scratchPath);
    await new Promise<void>((resolve, reject) => {
      readStream.on('error', reject);
      readStream.on('end', resolve);
      readStream.on('data', (chunk: Buffer | string) => {
        if (!gzip.write(chunk)) {
          readStream.pause();
          gzip.once('drain', () => readStream.resume());
        }
      });
    });
  }

  gzip.end();
  await endPromise;
  return Buffer.concat(chunks);
}

/**
 * Generate all solutions for a single face combination and write directly to a .mugbin temp file.
 *
 * Instead of accumulating all equations in memory, each (opsMask, total) group is streamed to its
 * own scratch file as equations are generated. Deduplication is handled per-group using a Set of
 * packed equation hex strings, avoiding the V8 Set size limit (~16.7M) that a global Set would hit.
 *
 * Peak memory is O(groups × (FLUSH_BUFFER_SIZE + dedup set)) rather than O(total equations).
 * Groups with >65535 equations are split into multiple summary entries to fit the uint16 count field.
 */
export async function generateAndWriteTempFile(
  faces: number[],
  minTotal: number,
  maxTotal: number,
  tempPath: string,
  flushHighWater: number,
): Promise<void> {
  const sortedFaces = [...faces].sort((a, b) => a - b);
  const diceCount = sortedFaces.length;
  const tokenCount = diceCount * 2 - 1;
  const equationLength = packedByteLength(tokenCount);
  const allOperations = OPERATIONS_LIST.map((op) => op.id);

  // Fresh scratch dir — remove any leftover from a previous failed run.
  const scratchDir = tempPath + '.groups';
  fs.rmSync(scratchDir, { recursive: true, force: true });
  fs.mkdirSync(scratchDir);

  const GROUP_BUFFER_SIZE = 64 * 1024; // 64 KB write buffer per group

  interface GroupState {
    opsMask: number;
    total: number;
    count: number;
    buf: Buffer;
    pos: number;
    fh: fs.promises.FileHandle;
    scratchPath: string;
    seen: Set<string>;
  }

  const groups = new Map<string, GroupState>();
  let totalBuffered = 0;

  async function flushGroup(g: GroupState): Promise<void> {
    if (g.pos > 0) {
      await g.fh.write(g.buf, 0, g.pos);
      totalBuffered -= g.pos;
      g.pos = 0;
    }
  }

  async function flushAll(): Promise<void> {
    for (const g of groups.values()) {
      await flushGroup(g);
    }
  }

  // Dedup uses packed equation bytes as a hex string key per group.
  // This distributes entries across many smaller Sets so no single Set
  // approaches V8's ~16.7M entry limit.
  //
  // Manual generator iteration so we can await async flushes between steps.
  const gen = generateResults(
    { faces: sortedFaces, operations: allOperations, minTotal, maxTotal },
    undefined, undefined, { deduplicate: false },
  );

  for (let result = gen.next(); !result.done; result = gen.next()) {
    const { total, postfixTokens } = result.value;
    const opsMask = postfixTokensToMask(postfixTokens);
    const key = `${opsMask}_${total}`;
    const packed = packTokens(postfixTokens);

    let g: GroupState | undefined = groups.get(key);
    if (!g) {
      const scratchPath = path.join(scratchDir, `${key}.bin`);
      g = {
        opsMask,
        total,
        count: 0,
        buf: Buffer.allocUnsafe(GROUP_BUFFER_SIZE),
        pos: 0,
        fh: await fs.promises.open(scratchPath, 'w'),
        scratchPath,
        seen: new Set(),
      };
      groups.set(key, g);
    }

    // Per-group deduplication using hex string of packed bytes.
    const dedupKey = Buffer.from(packed).toString('hex');
    if (g!.seen.has(dedupKey)) continue;
    g!.seen.add(dedupKey);

    if (g!.pos + equationLength > g!.buf.length) {
      // This single group buffer is full — flush just this one.
      await flushGroup(g!);
    }

    g!.buf.set(packed, g!.pos);
    g!.pos += equationLength;
    g!.count++;
    totalBuffered += equationLength;

    // If total buffered data across all groups exceeds the high-water mark,
    // flush everything. This creates natural backpressure: computation pauses
    // while I/O catches up, bounding memory usage without blocking on every write.
    if (totalBuffered >= flushHighWater) {
      await flushAll();
    }
  }

  // Flush remaining buffers and close all file handles.
  for (const g of groups.values()) {
    await flushGroup(g);
    await g.fh.close();
  }

  if (groups.size === 0) {
    fs.writeFileSync(tempPath, Buffer.alloc(0));
    fs.rmSync(scratchDir, { recursive: true });
    return;
  }

  // Sort groups by (total, opsMask) — required by the mugbin summary/equation ordering.
  const sortedGroups = [...groups.values()].sort(
    (a, b) => a.total - b.total || a.opsMask - b.opsMask,
  );

  // Release dedup sets now that generation is complete — free memory before compression.
  for (const g of sortedGroups) {
    g.seen = undefined!;
  }

  // Build summary entries. Groups with >65535 equations are split into multiple
  // summary entries to fit the uint16 count field.
  const MAX_SUMMARY_COUNT = 65535;
  interface SummaryEntry {
    opsMask: number;
    total: number;
    count: number;
  }
  const summaryEntries: SummaryEntry[] = [];
  for (const g of sortedGroups) {
    let remaining = g.count;
    while (remaining > MAX_SUMMARY_COUNT) {
      summaryEntries.push({ opsMask: g.opsMask, total: g.total, count: MAX_SUMMARY_COUNT });
      remaining -= MAX_SUMMARY_COUNT;
    }
    summaryEntries.push({ opsMask: g.opsMask, total: g.total, count: remaining });
  }

  const summaryData = Buffer.allocUnsafe(summaryEntries.length * SUMMARY_ENTRY_SIZE);
  for (let i = 0; i < summaryEntries.length; i++) {
    const s = summaryEntries[i];
    const off = i * SUMMARY_ENTRY_SIZE;
    summaryData.writeUInt16LE(s.total, off);
    summaryData.writeUInt8(s.opsMask, off + 2);
    summaryData.writeUInt16LE(s.count, off + 3);
  }

  // Stream all equation scratch files through a single gzip compressor in group order.
  const compressedEquations = await streamCompressGroupFiles(sortedGroups);

  // Build the faces key (packed tokens, zero-padded to FACES_KEY_SIZE bytes).
  const facesKeyBuf = new Uint8Array(FACES_KEY_SIZE);
  facesKeyBuf.set(packTokens(sortedFaces));

  // Build raw index (single entry — one face combination per temp file).
  const rawIndex = new Uint8Array(INDEX_ENTRY_SIZE);
  const rawIndexView = new DataView(rawIndex.buffer);
  rawIndex.set(facesKeyBuf, 0);
  rawIndexView.setUint8(4, diceCount);
  rawIndexView.setUint8(5, 0); // reserved
  rawIndexView.setUint32(6, 0, true);                          // summaryOffset = 0
  rawIndexView.setUint16(10, summaryData.length, true);        // summaryLength
  rawIndexView.setUint32(12, summaryData.length, true);        // equationsOffset = after summaries
  rawIndexView.setUint32(16, compressedEquations.length, true); // equationsLength

  const compressedIndex = await gzipCompress(rawIndex);

  // Build 16-byte header.
  const header = Buffer.allocUnsafe(HEADER_SIZE);
  new TextEncoder().encode(MUGBIN_MAGIC).forEach((b, i) => header.writeUInt8(b, i));
  header.writeUInt8(MUGBIN_FORMAT_VERSION, 6);
  header.writeUInt8(DB_VERSION, 7);
  header.writeUInt32LE(1, 8);                        // 1 index entry
  header.writeUInt32LE(compressedIndex.length, 12);

  // Write: header | compressed index | summaries | compressed equations.
  const outStream = fs.createWriteStream(tempPath);
  await streamWriteChunk(outStream, header);
  await streamWriteChunk(outStream, Buffer.from(compressedIndex));
  await streamWriteChunk(outStream, summaryData);
  await streamWriteChunk(outStream, compressedEquations);
  await new Promise<void>((resolve, reject) => {
    outStream.end();
    outStream.once('finish', resolve);
    outStream.once('error', reject);
  });

  // Clean up scratch files now that the temp mugbin is written.
  fs.rmSync(scratchDir, { recursive: true });
}

interface TempFileInfo {
  path: string;
  facesKey: Uint8Array;
  facesCount: number;
  summaryFileOffset: number;
  summaryLength: number;
  equationsFileOffset: number;
  equationsLength: number;
}

/**
 * Read only the header and compressed index of a single-entry temp mugbin file
 * to extract byte-offset metadata without loading equation data into memory.
 */
async function readTempFileInfo(tempPath: string): Promise<TempFileInfo> {
  const fh = await fs.promises.open(tempPath, 'r');
  try {
    const headerBuf = Buffer.allocUnsafe(HEADER_SIZE);
    await fh.read(headerBuf, 0, HEADER_SIZE, 0);
    const headerView = new DataView(headerBuf.buffer, headerBuf.byteOffset);
    const compressedIndexSize = headerView.getUint32(12, true);

    const indexBuf = Buffer.allocUnsafe(compressedIndexSize);
    await fh.read(indexBuf, 0, compressedIndexSize, HEADER_SIZE);

    // Parse index using MugbinReader with only the header + compressed index in memory.
    const combined = new Uint8Array(HEADER_SIZE + compressedIndexSize);
    combined.set(headerBuf);
    combined.set(indexBuf, HEADER_SIZE);
    const reader = new MugbinReader(new BufferDataSource(combined));
    await reader.loadIndex();
    const [entry] = reader.getIndex();

    return {
      path: tempPath,
      facesKey: new Uint8Array(entry.facesKey),
      facesCount: entry.facesCount,
      summaryFileOffset: entry.summaryOffset,
      summaryLength: entry.summaryLength,
      equationsFileOffset: entry.equationsOffset,
      equationsLength: entry.equationsLength,
    };
  } finally {
    await fh.close();
  }
}

/** Read a slice of a file into a Buffer without loading the whole file. */
async function readFileBytesAt(filePath: string, offset: number, length: number): Promise<Buffer> {
  if (length === 0) return Buffer.alloc(0);
  const fh = await fs.promises.open(filePath, 'r');
  try {
    const buf = Buffer.allocUnsafe(length);
    await fh.read(buf, 0, length, offset);
    return buf;
  } finally {
    await fh.close();
  }
}

/** Write a chunk to a WriteStream, honouring backpressure. */
function streamWriteChunk(stream: fs.WriteStream, chunk: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.write(chunk, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Two-pass streaming merge of per-face-combination temp mugbin files into a
 * single output mugbin file.
 *
 * Pass 1: read only the header + compressed index of each temp file to collect
 *         layout metadata (no equation data loaded).
 * Pass 2: write the combined header + compressed index, then stream each temp
 *         file's summary and equation blocks sequentially — only one file's
 *         data in memory at a time.
 */
export async function mergeTempMugbinFiles(tempPaths: string[], outputPath: string): Promise<void> {
  // Pass 1: collect metadata.
  const infos: TempFileInfo[] = [];
  for (const p of tempPaths) {
    infos.push(await readTempFileInfo(p));
  }

  // Sort entries by facesKey bytes (same order as MugbinWriter.build()).
  infos.sort((a, b) => {
    for (let i = 0; i < FACES_KEY_SIZE; i++) {
      if (a.facesKey[i] !== b.facesKey[i]) return a.facesKey[i] - b.facesKey[i];
    }
    return 0;
  });

  // Calculate new relative data-section offsets.
  let relOffset = 0;
  const newLayout: Array<{ summaryOffset: number; equationsOffset: number }> = [];
  for (const info of infos) {
    newLayout.push({ summaryOffset: relOffset, equationsOffset: relOffset + info.summaryLength });
    relOffset += info.summaryLength + info.equationsLength;
  }

  // Build raw combined index.
  const rawIndex = new Uint8Array(infos.length * INDEX_ENTRY_SIZE);
  const rawIndexView = new DataView(rawIndex.buffer);
  for (let i = 0; i < infos.length; i++) {
    const info = infos[i];
    const l = newLayout[i];
    const off = i * INDEX_ENTRY_SIZE;
    rawIndex.set(info.facesKey, off);
    rawIndexView.setUint8(off + 4, info.facesCount);
    rawIndexView.setUint8(off + 5, 0); // reserved
    rawIndexView.setUint32(off + 6, l.summaryOffset, true);
    rawIndexView.setUint16(off + 10, info.summaryLength, true);
    rawIndexView.setUint32(off + 12, l.equationsOffset, true);
    rawIndexView.setUint32(off + 16, info.equationsLength, true);
  }

  const compressedIndex = await gzipCompress(rawIndex);

  // Build header.
  const header = new Uint8Array(HEADER_SIZE);
  const headerView = new DataView(header.buffer);
  header.set(new TextEncoder().encode(MUGBIN_MAGIC), 0);
  headerView.setUint8(6, MUGBIN_FORMAT_VERSION);
  headerView.setUint8(7, DB_VERSION);
  headerView.setUint32(8, infos.length, true);
  headerView.setUint32(12, compressedIndex.length, true);

  // Pass 2: stream data to output file.
  const outStream = fs.createWriteStream(outputPath);
  try {
    await streamWriteChunk(outStream, Buffer.from(header));
    await streamWriteChunk(outStream, Buffer.from(compressedIndex));

    for (const info of infos) {
      // Summary blocks are small — buffer them entirely.
      const summaryBuf = await readFileBytesAt(info.path, info.summaryFileOffset, info.summaryLength);
      await streamWriteChunk(outStream, summaryBuf);

      // Equation blocks may be large — stream them chunk by chunk.
      if (info.equationsLength > 0) {
        const readStream = fs.createReadStream(info.path, {
          start: info.equationsFileOffset,
          end: info.equationsFileOffset + info.equationsLength - 1,
        });
        for await (const chunk of readStream) {
          await streamWriteChunk(outStream, chunk as Buffer);
        }
      }
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      outStream.end();
      outStream.once('finish', resolve);
      outStream.once('error', reject);
    });
  }
}

export async function generateAllSolutions(
  options: GenerateAllSolutionsOptions,
): Promise<string> {
  const { outputDir, dieSizes, minTotal, maxTotal } = options;

  if (dieSizes.length < 2) {
    throw new Error('At least 2 dice are required. A single die has no operations to combine.');
  }

  for (const size of dieSizes) {
    if (size < MIN_FACE_VALUE || size > MAX_FACE_VALUE) {
      throw new Error(
        `Die size ${size} is out of range. Face values must be between ${MIN_FACE_VALUE} and ${MAX_FACE_VALUE}.`,
      );
    }
  }

  const dieCount = dieSizes.length;
  const maxFaceValue = Math.max(...dieSizes);
  const faceCombinations = generateFaceCombinations(dieCount, maxFaceValue);
  const outputPath = path.resolve(outputDir, shardedFileName(dieCount));
  const tempDir = `${outputPath}.tmp`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });

  // Skip face combinations whose temp file already exists (resumability).
  const pendingCombinations = faceCombinations.filter(
    (faces) => !fs.existsSync(tempFilePath(tempDir, faces)),
  );
  const alreadyDone = faceCombinations.length - pendingCombinations.length;

  console.log(
    `Generating solutions for ${faceCombinations.length} face combinations ` +
      `(${dieCount} dice, max face value ${maxFaceValue})...`,
  );
  if (alreadyDone > 0) {
    console.log(`  Resuming: ${alreadyDone} of ${faceCombinations.length} already computed.`);
  }

  let completed = alreadyDone;
  const total = faceCombinations.length;
  const startTime = Date.now();

  if (pendingCombinations.length > 0) {
    // Cap at cpus-1 to always leave one thread free for cancellation/OS responsiveness.
    const maxConcurrency = Math.max(1, os.cpus().length - 1);
    const defaultConcurrency = Math.max(1, os.cpus().length - 2);
    const concurrency = Math.min(
      options.concurrency !== undefined
        ? Math.max(1, options.concurrency)
        : defaultConcurrency,
      maxConcurrency,
      pendingCombinations.length,
    );

    // Compute per-worker memory budget for write buffering based on free memory at startup.
    // Reserve 512 MB for the main thread, OS, and other processes.
    const freeMemory = os.freemem();
    const reservedMemory = 512 * 1024 * 1024;
    const availableForWorkers = Math.max(freeMemory - reservedMemory, 128 * 1024 * 1024);
    const perWorkerHighWater = Math.floor(availableForWorkers / concurrency);

    console.log(
      `  Workers: ${concurrency}, memory budget per worker: ${(perWorkerHighWater / (1024 * 1024)).toFixed(0)} MB`,
    );

    const tasks: WorkerTask[] = pendingCombinations.map((faces) => ({
      faces,
      minTotal,
      maxTotal,
      tempPath: tempFilePath(tempDir, faces),
      flushHighWater: perWorkerHighWater,
    }));

    // Create the worker pool upfront. Workers are reused across tasks via
    // postMessage rather than being spawned and terminated per task.
    const workerPool = Array.from(
      { length: concurrency },
      () => new Worker(new URL('./worker.js', import.meta.url)),
    );

    let taskIndex = 0;
    const EMA_ALPHA = 0.3;
    let emaMsPerTask = 0;

    function printProgress(): void {
      const remaining = total - completed;
      // Divide by concurrency since workers run in parallel.
      const eta = emaMsPerTask > 0 ? formatTimeRemaining(emaMsPerTask / concurrency, remaining) : '';
      const pct = ((completed / total) * 100).toFixed(1);
      process.stdout.write(
        `\r  Progress: ${completed}/${total} (${pct}%)${eta ? ` — ${eta}` : ''}          `,
      );
    }

    const progressInterval = setInterval(printProgress, 5000);

    async function runWorker(worker: Worker): Promise<void> {
      while (taskIndex < tasks.length) {
        const task = tasks[taskIndex++];
        const taskStart = Date.now();

        const msg = await new Promise<WorkerResult>((resolve, reject) => {
          const onMessage = (result: WorkerResult) => {
            worker.off('error', onError);
            resolve(result);
          };
          const onError = (err: Error) => {
            worker.off('message', onMessage);
            reject(err);
          };
          worker.once('message', onMessage);
          worker.once('error', onError);
          worker.postMessage(task);
        });

        const taskDuration = Date.now() - taskStart;
        emaMsPerTask = emaMsPerTask === 0
          ? taskDuration
          : EMA_ALPHA * taskDuration + (1 - EMA_ALPHA) * emaMsPerTask;

        completed++;
        if (msg.success) {
          printProgress();
        } else {
          console.error(`\n  Error for faces [${msg.faces.join(', ')}]: ${msg.error}`);
        }
      }
    }

    try {
      await Promise.all(workerPool.map(runWorker));
    } finally {
      clearInterval(progressInterval);
      await Promise.all(workerPool.map((w) => w.terminate().catch(() => {})));
    }
  }

  console.log('\nMerging solutions...');
  // Only merge files that exist and have content (skip missing and 0-byte marker files).
  const allTempPaths = faceCombinations
    .map((faces) => tempFilePath(tempDir, faces))
    .filter((p) => fs.existsSync(p) && fs.statSync(p).size > 0);
  await mergeTempMugbinFiles(allTempPaths, outputPath);

  // Clean up temp directory now that the final file is written.
  fs.rmSync(tempDir, { recursive: true });

  const sizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Done. Written ${outputPath} (${sizeMB} MB, ${total} face combinations, ${elapsedSec}s)`);

  return outputPath;
}
