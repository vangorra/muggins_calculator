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

export async function formatCodeApply() {
  await spawnCommand(
    resolve(binDir, "prettier"),
    "--write", "src/"
  );
}

export async function formatCodeCheck() {
  await spawnCommand(
    resolve(binDir, "prettier"),
    "--list-different", "src/"
  );
}

export async function generateIcons() {
  await spawnCommand(
    resolve(binDir, "ngx-pwa-icons"),
  );
}

export async function lintApply() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "lint", "--fix"
  );
}

export async function lintCheck() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "lint"
  );
}

export async function compile() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "build"
  );
}

export async function test() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "test",
    "--watch", "false",
    "--browsers", "Chromium,ChromeHeadless,Firefox,FirefoxHeadless"
  );
}
export async function testCi() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "test",
    "--watch", "false",
    "--browsers", "ChromeHeadless,FirefoxHeadless"
  );
}


export async function testWatch() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "test",
    "--watch", "true",
    "--browsers", "Chromium"
  );
}

async function startHttpServer() {
  await spawnCommand(
    resolve(binDir, "http-server"),
    "-p", "8080",
    "-c", "-1",
    "dist/app"
  )
}

async function startNg() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "serve"
  )
}

export const build = gulp.series(
  formatCodeApply,
  generateIcons,
  lintApply,
  compile,
  test
);

export const buildCi = gulp.series(
  formatCodeCheck,
  generateIcons,
  lintCheck,
  compile,
  testCi
);

export const servePwa = gulp.series(
  generateIcons,
  compile,
  startHttpServer
);

export const serve = gulp.series(
  generateIcons,
  startNg
);

export default build;
