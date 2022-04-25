import * as gulp from "gulp";
import {spawn} from "child_process";
import {resolve} from "path";
import * as fs from "fs";
import {generateMergedCoverageReports} from "./lib/istabul-utils";
import {Socket} from "net";

const DIR_BIN = resolve("./node_modules/.bin/");
const DIR_BUILD = resolve("build");
const DIR_DIST = resolve("dist");
const TARGET_DIRS = [DIR_BUILD, DIR_DIST];
const SERVE_PORT = 4200;

function bin(command: string): string {
  return resolve(DIR_BIN, command);
}

export function clean() {
  return Promise.all(TARGET_DIRS
    .map(async (dir) => {
      console.log(`Removing ${dir}`);
      await fs.promises.rmdir(dir, {
        recursive: true
      });
    })
  );
}
clean.description = `Remove directories: ` + TARGET_DIRS.join(",");

export function formatCodeApply() {
  return spawn(
    bin("prettier"),
    ["--write", "src/"],
    {stdio: "inherit"}
  );
}
formatCodeApply.description = "Format source code.";

export function formatCodeCheck() {
  return spawn(
    bin("prettier"),
    ["--list-different", "src/"],
    {stdio: "inherit"}
  );
}
formatCodeCheck.description = "Check if source code is formatted.";

export function generateIcons() {
  return spawn(
    bin("ngx-pwa-icons"),
    ["--output", resolve("./build/generated_assets/icons")],
    { stdio: 'inherit' }
  );
}
generateIcons.description = "Generate icons.";

export function lintApply() {
  return spawn(
    bin("ng"),
    ["lint", "--fix"],
    { stdio: 'inherit' }
  );
}
lintApply.description = "Lint code and apply changes (if possible).";

export function lintCheck() {
  return spawn(
    bin("ng"),
    ["lint"],
    { stdio: 'inherit' }
  );
}
lintCheck.description = "Check if code passes lint checks.";

export function build() {
  return spawn(
    bin("ng"),
    ["build", "--configuration", "production"],
    { stdio: 'inherit' }
  );
}
build.description = "Compile the code.";

async function assertServePortUnused() {
  return new Promise<void>((res, rej) => {
    const socket = new Socket();

    const onPortUsed = () => {
      socket.destroy();
      rej(new Error(`Server port ${SERVE_PORT} is in use by another process.`));
    };

    const onPortAvailable = () => {
      socket.destroy();
      res();
    };

    socket.on("timeout", onPortAvailable);
    socket.on("connect", onPortAvailable);
    socket.on("error", (err: any) => {
      if (err.code !== "ECONNREFUSED") {
        onPortUsed();
      } else {
        onPortAvailable();
      }
    });

    socket.connect(SERVE_PORT, "127.0.0.1");
    setTimeout(onPortAvailable, 500);
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
      '--watch',
      '--plugin', '~angular_coverage_plugin.js',
      '--configuration', 'production'
    ]
  );

  // Triggered from the initial build (below). Starts the server.
  const startServeProcess = () => {
    const localWebServerProcess = spawn(
      bin('browser-sync'),
      [
        'start',
        '--single',
        '--watch',
        '--serveStatic', './dist/app',
        '--no-open',
        '--port', SERVE_PORT + "",
        '--index', 'index.html',
        '--ui-port', '3000',
        '--logLevel', 'silent'
      ],
      { stdio: "inherit" }
    );

    console.log("");
    console.log("");
    console.log("======================");
    console.log("Initial build finished. Muggins app is ready to use.");
    console.log(`http://localhost:${SERVE_PORT}`);
    console.log("======================");
    console.log("");

    // Ensure both build and serve processes are killed when the other exits.
    buildWatchProcess.on("exit", () => localWebServerProcess.kill("SIGINT"));
    localWebServerProcess.on('exit', () => buildWatchProcess.kill('SIGINT'));
  };

  // Listen for initial build output, once build it complete, start the http server.
  const buildAtRegex = /^Build at: .+ - Hash: .+ - Time: .+ms$/g;
  const initialBuildListener = (buffer: any) => {
    const isBuilt = buffer.toString().split("\n")
      .findIndex((line: string) => buildAtRegex.test(line)) > -1;

    if (!isBuilt) {
      return;
    }

    // Initial build complete, stop listening and start the serve process.
    buildWatchProcess.stdout.off("data", initialBuildListener);
    startServeProcess();
  };
  // Get build output to the console.
  buildWatchProcess.stdin.pipe(process.stdin);
  buildWatchProcess.stdout.pipe(process.stdout);
  buildWatchProcess.stderr.pipe(process.stderr);
  // Listen for initial build completion.
  buildWatchProcess.stdout.on("data", initialBuildListener);

  // Ensure the icon watch process is stopped when the build process exits.
  buildWatchProcess.on("exit", () => {
    iconWatcher.close();
  });

  return buildWatchProcess;
}

export const serve = gulp.series(
  assertServePortUnused,
  startServe
);
serve.description = "Serve the application on a local port.";

export function unitTest() {
  return spawn(
    bin("ng"),
    ["test", "--watch", "false"],
    { stdio: 'inherit' }
  );
}
unitTest.description = `Run unit tests`;

export function endToEndTest() {
  return spawn(
    bin("playwright"),
    ["test"],
    { stdio: 'inherit' },
  );
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
unifyCoverage.description = "Combine the unit and end-to-end code coverage reports.";

export const buildFullCi = gulp.series(
  generateIcons,
  formatCodeCheck,
  lintCheck,
  unitTest,
  endToEndTest,
  unifyCoverage,
  build
);
buildFullCi.description = "Generate icons, check code format, check lint, test, and compile.";

export const buildFull = gulp.series(
  generateIcons,
  formatCodeApply,
  lintApply,
  unitTest,
  endToEndTest,
  unifyCoverage,
  build
);
buildFull.description = "Generate icons, format code, apply lint, compile, test, and compile.";

export default buildFull;
