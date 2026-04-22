import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

const testSolutionsDir = path.resolve(__dirname);
const cliMain = path.resolve(__dirname, '../../cli/dist/main.js');

export default async function globalSetup(): Promise<void> {
  // Generate a 3d3 test solutions file (will be named solutions-3d.mugbin).
  const testDbPath = path.join(testSolutionsDir, 'solutions-3d.mugbin');

  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }

  if (!existsSync(cliMain)) {
    throw new Error(
      `CLI not built. Run: npm run build -w packages/cli\n  Expected: ${cliMain}`
    );
  }

  console.log('Generating test solutions database (3 dice, 3 sides)...');
  execSync(
    `node "${cliMain}" generate-all-solutions --outputDir "${testSolutionsDir}" --dieSize "3,3,3"`,
    { stdio: 'inherit' }
  );
  console.log(`Test solutions database generated at: ${testDbPath}`);
}
