import * as gulp from 'gulp';
import { spawn } from 'child_process';
import { generateMergedCoverageReports } from './lib/istabul.utils';
import * as net from 'net';
import * as path from 'path';
import { filePathExists } from './lib/fs.utils';
import fs from 'fs';

const DIR_BIN = path.resolve('./node_modules/.bin/');
const DIR_BUILD = path.resolve('build');
const DIR_DIST = path.resolve('dist');
const TARGET_DIRS = [DIR_BUILD, DIR_DIST];
const SERVE_PORT = 4200;

function bin(command: string): string {
  return path.resolve(DIR_BIN, command);
}

function cleanDist() {
  return fs.promises.rm(DIR_DIST, { recursive: true, force: true });
}

export async function clean() {
  return Promise.all(
    TARGET_DIRS.map((filePath) =>
      fs.promises.rm(filePath, { recursive: true, force: true })
    )
  );
}
clean.description = `Remove directories: ` + TARGET_DIRS.join(',');

const checkGlobs = ['src/', 'playwright/', '*.ts', '*.js'];

export function formatCodeApply() {
  return spawn(bin('prettier'), ['--write', ...checkGlobs], {
    stdio: 'inherit',
  });
}
formatCodeApply.description = 'Format source code.';

export function formatCodeCheck() {
  return spawn(bin('prettier'), ['--list-different', ...checkGlobs], {
    stdio: 'inherit',
  });
}
formatCodeCheck.description = 'Check if source code is formatted.';

export function generateIcons() {
  return spawn(
    bin('ngx-pwa-icons'),
    ['--output', path.resolve('./build/generated_assets/icons')],
    { stdio: 'inherit' }
  );
}
generateIcons.description = 'Generate icons.';

export function lintApply() {
  return spawn(bin('ng'), ['lint', '--fix'], { stdio: 'inherit' });
}
lintApply.description = 'Lint code and apply changes (if possible).';

export function lintCheck() {
  return spawn(bin('ng'), ['lint'], { stdio: 'inherit' });
}
lintCheck.description = 'Check if code passes lint checks.';

export function build() {
  return spawn(bin('ng'), ['build', '--configuration', 'production'], {
    stdio: 'inherit',
  });
}
build.description = 'Compile the code.';

export function deploy() {
  return spawn(
    bin('ng'),
    ['deploy'], // Additional options are configured inside angular.json.
    { stdio: 'inherit' }
  );
}
deploy.description = 'Build and deploy the application to github pages.';

const isPortAvailable = (port: number) =>
  new Promise<void>((res, rej) => {
    const server = net.createServer();
    server.once('error', () => {
      server.close(() => rej(new Error(`Port '${port}' is not available.`)));
    });
    server.once('listening', () => {
      server.close(() => res());
    });

    server.listen(port);
  });

export async function assertServePortUnused() {
  try {
    await isPortAvailable(SERVE_PORT);
  } catch (e) {
    let messageExtra = '';
    if (await filePathExists('/.dockerenv')) {
      messageExtra =
        'One probably has serve running from another terminal in the devenv.';
    } else {
      messageExtra =
        'The devenv is probably running (run ./devenv.sh status to check) or another process has this port open.';
    }

    throw new Error(
      `Serve port ${SERVE_PORT} is not available. ${messageExtra}`
    );
  }
}

/**
 * gulp.watch can only watch files in directories that exist. So we wrote our own.
 * @param filePath
 * @param pollDuration
 */
function pollForFileExists(
  filePath: string,
  pollDuration = 500
): Promise<void> {
  return new Promise<void>((res) => {
    const interval = setInterval(async () => {
      if (await filePathExists(filePath)) {
        clearInterval(interval);
        res();
      }
    }, pollDuration);
  });
}

function startServe() {
  // Build icons and listen for changes.
  generateIcons();
  const iconWatcher = gulp.watch('./icon.png', () => generateIcons());

  // Start build and watch for changes.
  const buildWatchProcess = spawn(
    bin('ng'),
    [
      'build',
      '--progress',
      '--watch',
      '--plugin',
      '~angular_coverage_plugin.js',
      '--configuration',
      'production',
    ],
    { stdio: 'inherit' }
  );

  // Wait for initial build to finish.
  pollForFileExists('./dist/app/index.html')
    // Wait a moment for things to settle.
    .then(() => new Promise((res) => setTimeout(res, 3000)))
    // Start the server.
    .then(() => {
      const localWebServerProcess = spawn(
        bin('browser-sync'),
        [
          'start',
          '--single',
          '--watch',
          '--serveStatic',
          './dist/app',
          '--no-open',
          '--port',
          SERVE_PORT + '',
          '--index',
          'index.html',
          '--ui-port',
          '3000',
          '--logLevel',
          'silent',
        ],
        { stdio: 'inherit' }
      );

      // Ensure both build and serve processes are killed when the other exits.
      buildWatchProcess.on('exit', () => localWebServerProcess.kill('SIGINT'));
      localWebServerProcess.on('exit', () => buildWatchProcess.kill('SIGINT'));

      console.log('');
      console.log('');
      console.log('======================');
      console.log(
        'Initial build finished. Muggins app is accessible at the following URL..'
      );
      console.log(`http://localhost:${SERVE_PORT}`);
      console.log('======================');
      console.log('');
    });

  // Ensure the icon watch process is stopped when the build process exits.
  buildWatchProcess.on('exit', () => {
    iconWatcher.close();
  });

  return buildWatchProcess;
}

export const serve = gulp.series(cleanDist, assertServePortUnused, startServe);
serve.description = 'Serve the application on a local port.';

export function unitTest() {
  return spawn(bin('ng'), ['test', '--watch', 'false'], { stdio: 'inherit' });
}
unitTest.description = `Run unit tests`;

export function endToEndTest() {
  return spawn(bin('playwright'), ['test'], { stdio: 'inherit' });
}
endToEndTest.description = `Run end-to-end tests.`;

export function unifyCoverage() {
  return generateMergedCoverageReports(
    [
      './build/coverage/jest/coverage-final.json',
      './build/coverage/playwright/coverage-final.json',
    ],
    './build/coverage/unified/',
    ['html', 'json', 'lcovonly']
  );
}
unifyCoverage.description =
  'Combine the unit and end-to-end code coverage reports.';

export const buildFullCi = gulp.series(
  clean,
  generateIcons,
  formatCodeCheck,
  lintCheck,
  unitTest,
  endToEndTest,
  unifyCoverage,
  build
);
buildFullCi.description =
  'Generate icons, check code format, check lint, test, and compile.';

export const buildFull = gulp.series(
  clean,
  generateIcons,
  formatCodeApply,
  lintApply,
  unitTest,
  endToEndTest,
  unifyCoverage,
  build
);
buildFull.description =
  'Generate icons, format code, apply lint, compile, test, and compile.';

export default buildFull;
