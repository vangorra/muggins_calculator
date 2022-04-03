import * as gulp from "gulp";
import {spawn} from "child_process";
import {FSWatcher, readFile, rmdir, writeFile} from "fs";
import {resolve} from "path";
import {promisify} from "util";
import * as BrowserSync from "browser-sync";
import {js2xml, xml2js} from "xml-js";
import {glob} from "glob";
import { uniq} from "lodash";

const rmdirAsync = promisify(rmdir);
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const globAsync = promisify(glob);

const binDir = resolve("./node_modules/.bin/");
const buildDir = resolve("build");
const distDir = resolve("dist");
const targetDirs = [buildDir, distDir];

const testBrowsers = ["Chromium", "ChromeHeadless", "Firefox", "FirefoxHeadless"];
const testBrowsersStr = testBrowsers.join(",");
const testCiBrowsers = ["ChromeHeadless", "FirefoxHeadless"];
const testCiBrowsersStr = testCiBrowsers.join(",");
const targetDirsStr = targetDirs.join(",");

const browserSync = BrowserSync.create()

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
    "--output", resolve("./dist/generated_assets/icons")
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

export async function ngBuild() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "build",
    "--configuration", "production"
  );
}
ngBuild.description = "Compile the code.";

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

async function startNg() {
  await spawnCommand(
    resolve(binDir, "ng"),
    "serve"
  )
}
startNg.description = "Start locally using 'ng serve'.";

export async function copyIconsToAssets() {
  // Determine which icons are used in html files.
  const regex = new RegExp('svgIcon="([^"]+)"', 'g');
  const files = await globAsync(resolve("./src/**/*.html"));
  const filesContents = await Promise.all(files.map(async filePath => await readFileAsync(filePath)));
  const iconIds = uniq(filesContents
    .map(fileContents => [
      ...fileContents.toString().matchAll(regex)
    ])
    .filter(matches => !!matches.length)
    .map(matches => matches.map(match => match[1]))
    .flatMap(arr => arr)
  );

  // Create a smaller icons files containing only the icons from above.
  const keepIds = new Set(iconIds);
  const sourcePath = resolve("./node_modules/@mdi/angular-material/mdi.svg");
  const contents = await readFileAsync(sourcePath);
  const svg = xml2js(contents.toString());

  svg["elements"][0]["elements"][0]["elements"] = svg["elements"][0]["elements"][0]["elements"].filter((element: any) => {
    const tagName = element["name"];
    return tagName !== "svg" || keepIds.has(element["attributes"]["id"]);
  });
  await writeFileAsync(
    resolve("./dist/generated_assets/mdi.svg"),
    js2xml(svg)
  );
}

const buildMinimal = gulp.series(
  generateIcons,
  copyIconsToAssets,
  ngBuild
);

export const buildCi = gulp.series(
  formatCodeCheck,
  lintCheck,
  buildMinimal
);

export const buildAndTestCi = gulp.series(
  buildCi,
  testCi
);

export const build = gulp.series(
  formatCodeApply,
  lintApply,
  buildMinimal
);
build.description = "Format, generate, lint, compile and test.";

export const buildAndTest = gulp.series(
  build,
  test
);
build.description = "Format, generate, lint, compile and test.";

async function startServe() {
  console.log("startServe");
  browserSync.init({
    port: 8080,
    server: {
      baseDir: "./dist/app",
    }
  });
  console.log("/startServe");
}

let serveFileWatcher: FSWatcher;
async function startServeWatch() {
  console.log("startServeWatch");
  serveFileWatcher = gulp.watch(
    [
      "./icon.png",
      "./src/**",
      "!./src/**/*.spec.*"
    ],
    buildAndReload
  );
  console.log("/startServeWatch");
}

async function stopServeWatch() {
  console.log("stopServeWatch");
  serveFileWatcher && serveFileWatcher.close();
  console.log("/stopServeWatch");
}

const buildAndReload = gulp.series(
  clean,
  // Stop watching as lint and code style changes will change the watches files and lead to a shallow loop.
  stopServeWatch,
  build,
  startServeWatch,
  browserSync.reload
);

export const serve = gulp.series(
  clean,
  build,
  startServe,
  startServeWatch
);
serve.description = "Build and serve using local HTTP server. Better than 'ng serve' as the former does not work with progressive web apps.";

export default build;
