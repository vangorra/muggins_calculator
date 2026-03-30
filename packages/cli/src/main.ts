#!/usr/bin/env node
import { Command } from 'commander';
import { generateSolutions, generateAllSolutions } from './generate.js';
import { MIN_FACE_VALUE, MAX_FACE_VALUE } from '@muggins_calculator/common';

const program = new Command();

function parsePositiveIntegers(value: string, label: string): number[] {
  const parts = value.split(',');
  const nums = parts.map(Number);
  const invalid = parts.filter((p, i) => !Number.isInteger(nums[i]) || nums[i] <= 0);
  if (invalid.length > 0) {
    console.error(`Error: ${label} must be positive integers, got: ${invalid.join(', ')}`);
    process.exit(1);
  }
  return nums;
}

function validateFaceRange(values: number[], label: string): void {
  const outOfRange = values.filter((v) => v < MIN_FACE_VALUE || v > MAX_FACE_VALUE);
  if (outOfRange.length > 0) {
    console.error(
      `Error: ${label} values must be between ${MIN_FACE_VALUE} and ${MAX_FACE_VALUE}, got: ${outOfRange.join(', ')}`,
    );
    process.exit(1);
  }
}

program
  .name('muggins-cli')
  .description('Muggins Calculator CLI');

program
  .command('generate-solutions')
  .description('Generate pre-computed solutions for a specific face combination into a .mugbin file')
  .requiredOption('--output <file>', 'Output .mugbin file path')
  .requiredOption('--faces <faces>', 'Comma-separated face values (e.g., "2,3,4")')
  .option('--min-total <n>', 'Minimum total', '0')
  .option('--max-total <n>', 'Maximum total', '72')
  .action(async (options) => {
    const faces = parsePositiveIntegers(options.faces, '--faces');
    validateFaceRange(faces, '--faces');
    await generateSolutions({
      outputPath: options.output,
      faces,
      minTotal: parseInt(options.minTotal),
      maxTotal: parseInt(options.maxTotal),
    });
  });

program
  .command('generate-all-solutions')
  .description('Generate pre-computed solutions for all face combinations of given die sizes into a sharded .mugbin file')
  .option('--outputDir <dir>', 'Output directory (file will be named solutions-Nd.mugbin)', 'solutions')
  .requiredOption('--dieSize <sizes>', 'Comma-separated die sizes (e.g., "6,6,6" for 3 six-sided dice)')
  .option('--min-total <n>', 'Minimum total', '0')
  .option('--max-total <n>', 'Maximum total', '72')
  .option('--concurrency <n>', 'Number of parallel workers (default: cpus-2, max: cpus-1)')
  .action(async (options) => {
    const dieSizes = parsePositiveIntegers(options.dieSize, '--dieSize');
    validateFaceRange(dieSizes, '--dieSize');

    let concurrency: number | undefined;
    if (options.concurrency !== undefined) {
      concurrency = parseInt(options.concurrency, 10);
      if (!Number.isInteger(concurrency) || concurrency < 1) {
        console.error('Error: --concurrency must be a positive integer');
        process.exit(1);
      }
    }

    await generateAllSolutions({
      outputDir: options.outputDir,
      dieSizes,
      minTotal: parseInt(options.minTotal),
      maxTotal: parseInt(options.maxTotal),
      concurrency,
    });
  });

program.parse();
