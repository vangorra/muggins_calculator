import * as gulp from "gulp";
import { spawn } from "child_process";
import { rmdir } from "fs";
import { resolve } from "path";
import { promisify } from "util";

const rmdirAsync = promisify(rmdir);

const binDir = resolve("./node_modules/.bin/");
const buildDir = resolve("build");
const distDir = resolve("dist");
const targetDirs = [buildDir, distDir];

const testBrowsers = ["Chromium", "ChromeHeadless", "Firefox", "FirefoxHeadless"];
const testBrowsersStr = testBrowsers.join(",");
const testCiBrowsers = ["ChromeHeadless", "FirefoxHeadless"];
const testCiBrowsersStr = testCiBrowsers.join(",");

async function spawnCommand(command: string, ...args: string[]): Promise<number> {
  return new Promise<number>(res => {
    const process = spawn(command, args, { stdio: 'inherit' });
    process.on("close", res);
  });
}

export async function clean() {
  await Promise.all(targetDirs
    .map(async (dir) => {
      console.log(`Removing ${dir}`);
      await rmdirAsync(dir, {
        recursive: true
      });
    })
  );
}
const targetDirsStr = targetDirs.join(",");
clean.description = `Remove directories: ${targetDirsStr}`;

export async function formatCodeApply() {
  await spawnCommand(
    resolve(binDir, "prettier"),
    "--write", "src/"
  );
}
formatCodeApply.description = "Format source code.";

export async function formatCodeCheck() {
  await spawnCommand(
    resolve(binDir, "prettier"),
    "--list-different", "src/"
  );
}
formatCodeCheck.description = "Check if code is formatted.";

export async function generateIcons() {
  await spawnCommand(
    resolve(binDir, "ngx-pwa-icons"),
  );
}
generateIcons.description = "Generate icons.";

export async function lintApply() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "lint", "--fix"
  );
}
lintApply.description = "Lint code and apply changes (if possible).";

export async function lintCheck() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "lint"
  );
}
lintCheck.description = "Check if code passes lint checks.";

export async function compile() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "build",
    "--configuration", "production"
  );
}
compile.description = "Compile the code.";

async function compileWatch() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "build",
    "--configuration", "production",
    "--watch"
  );
}

export async function test() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "test",
    "--watch", "false",
    "--browsers", testBrowsersStr
  );
}
test.description = `Test code with browsers: ${testBrowsersStr}`;

export async function testCi() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "test",
    "--watch", "false",
    "--browsers", testCiBrowsersStr
  );
}
test.description = `Test code in continuous integration with browsers: ${testCiBrowsersStr}`;

export async function testWatch() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "test",
    "--watch", "true",
    "--browsers", "Chromium"
  );
}
testWatch.description = "Test and watch for changes.";

export async function startHttpServer() {
  await spawnCommand(
    resolve(binDir, "http-server"),
    "-p", "8080",
    "-c", "0",
    "dist/app"
  )
}
startHttpServer.description = "Start HTTP server for hosting compiled code.";

async function startNg() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "serve"
  )
}
startNg.description = "Start locally using 'ng serve'.";

export const build = gulp.series(
  generateIcons,
  formatCodeApply,
  lintApply,
  compile,
  test
);
build.description = "Format, generate, lint, compile and test.";

export const buildCi = gulp.series(
  generateIcons,
  formatCodeCheck,
  lintCheck,
  compile,
  testCi
);
buildCi.description = `Check format, generate, check lint, compile and test with browsers (${testCiBrowsers}).`;

async function watchIcons() {
  gulp.watch("./icon.png", generateIcons);
}

export const serve = gulp.series(
  clean,
  gulp.parallel(
    watchIcons,
    generateIcons,
    compileWatch,
    startHttpServer
  )
);
serve.description = "Build and serve using local HTTP server. Better than 'ng serve' as the former does not work with progressive web apps.";

export default build;
