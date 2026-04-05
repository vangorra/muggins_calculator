# CLAUDE.md - Muggins Calculator

## Project Overview
Muggins Calculator is an Angular 21 web application that calculates all possible mathematical equations from dice rolls in the Muggins board game. Live at: https://vangorra.github.io/muggins_calculator/

## Architecture
- **Monorepo** using npm workspaces: `packages/ui`, `packages/common`, `packages/cli`
- **UI**: Angular 21 standalone components with Material Design 3
- **Common**: Pure TypeScript equation solver with Web Worker support and mugbin binary format
- **CLI**: Node.js CLI for pre-generating solutions into `.mugbin` files

## Commands
```bash
npm start                # Start dev server (http://localhost:4200)
npm test                 # Run all unit tests (UI + solver + CLI)
npm run e2e              # Run Playwright end-to-end tests
npm run build            # Production build all workspaces
npm run format           # Run Prettier
npm run generate-all-solutions -- "6,6,6"  # Generate solutions/solutions-3d.mugbin
```

### Package-level commands
```bash
cd packages/ui && npx ng serve             # Dev server
cd packages/ui && npx ng build             # Production build
cd packages/ui && npx ng test              # UI unit tests
cd packages/ui && npx playwright test      # E2E tests
cd packages/common && npx vitest run        # Common (solver) unit tests
cd packages/cli && npx vitest run          # CLI unit tests
```

## Key Patterns

### Components & Services
- All components are **standalone** with inline `imports` arrays
- Use `inject()` instead of constructor injection
- Use Angular **signals** for state management (not BehaviorSubject for component state)
- Use `@angular/cdk/scrolling` for virtual scrolling
- Services use `providedIn: 'root'`

### Solver & Workers
- **4 persistent web workers** created at app startup, reused across calculations
- `p-queue` (concurrency=4) dispatches work to idle workers
- `comlink` for worker RPC communication (use `Remote<T>` type)
- Workers are NOT terminated between calculations -- only the queue is cleared on cancel
- `solver-common.ts` contains pure computation logic exposed to workers
- `solver-orchestrator.ts` manages the worker pool and queue
- **Same worker handles both brute-force solving and mugbin operations**: `solver.worker.browser.ts` exposes `commonWorkerFunctions` (for coordinator) and `solutionsWorkerFunctions` (for SolutionsService) on `self`
- `solutions-worker-impl.ts` contains mugbin worker logic: HTTP fetching (`FetchDataSource`), `MugbinReader` caching, opsMask filtering, `postfixToInfixGrouped` conversion, and result formatting — all off the main thread
- `SolutionsService` delegates to the worker via `comlink`; version checking (localStorage) stays on the main thread
- `SOLUTIONS_WORKER_API` injection token allows tests to provide the impl directly (bypassing real workers)

### Precomputed Solutions (mugbin v2)
- Solutions are pre-generated at build time by the CLI into **sharded** `.mugbin` files — one per dice count (e.g., `solutions-3d.mugbin`)
- CLI `--outputDir` defaults to `solutions/` — **publish.yml relies on this default** (no `--outputDir` flag passed; copy step reads from `solutions/`)
- Format v2: gzip-compressed index block, one index entry per face combination (opsMask moved to summary entries)
- Summary entries are 5 bytes: `(total: uint16LE, opsMask: uint8, count: uint16LE)`, sorted by `(total, opsMask)`
- Index offsets are relative to the data section start (`16 + compressed_index_size`)
- The UI fetches solution data via HTTP Range requests on a worker (no full file download, no main-thread blocking)
- `findEntries(faces)` finds the single index entry; `getJumpData(entries, opsMask)` and `getEquationsForTotal(entries, total, opsMask)` filter by opsMask at the summary level
- The dev server (`serve-solutions.js`) serves `solutions-*d.mugbin` files from a `SOLUTIONS_DIR` directory
- Proxy config (`proxy.conf.js`) forwards `/solutions-*d.mugbin` to the solutions server
- See `packages/common/src/mugbin.ts` for the format spec and `README.md` for documentation

### Testing
- **Unit tests**: Angular's `@angular/build:unit-test` (vitest-based, in `.spec.ts` files)
- **Common unit tests**: Vitest (`packages/common/src/*.spec.ts`)
- **CLI unit tests**: Vitest (`packages/cli/src/*.spec.ts`)
- **E2E tests**: Playwright with screenshot comparison (`packages/ui/playwright/tests/`)
- **100% test coverage** is required via combination of e2e and unit tests
- Tests live alongside source files (`component.spec.ts` next to `component.ts`)
- **Run all tests after every code change** and fix any failures before proceeding

### Coverage
- All test suites produce **lcov** coverage reports
- UI unit tests: configured via `coverage` and `coverageReporters` in `angular.json`
- Common unit tests: configured via `vitest.config.ts` with `reporter: ['text', 'lcov']`
- CLI unit tests: configured via `vitest.config.ts` with `reporter: ['text', 'lcov']`
- Coverage is uploaded to Coveralls in CI

### Playwright Screenshots
- Screenshots use `toMatchSnapshot()` for visual regression testing
- Screenshot filenames must be **descriptive of what the user should verify** (e.g., `selected_faces_2_3_4.png`, `change_theme_to_dark.png`)
- Screenshots are committed to git in `*-snapshots/` directories alongside test files
- Screenshots are uploaded as CI artifacts for PR comparison

### Styling
- SCSS with Angular Material 3 theme system
- CSS flexbox for layout (no FlexLayout library)
- Responsive via `@media` queries in component SCSS

## File Conventions
- Components: `.component.ts`, `.component.html`, `.component.scss`
- Services: `.service.ts` with `providedIn: 'root'`
- Tests: `.spec.ts` alongside source files
- Workers: `.worker.browser.ts` (UI), `worker.ts` (CLI)

## Cross-Cutting Sync Rules

When making changes, keep these interconnected pieces in sync:

### Solutions pipeline (mugbin v2, sharded)
All of these must reference `.mugbin` (NOT `.db` or `.json`) and use the sharded pattern (`solutions-Nd.mugbin`):
- `packages/ui/src/app/solver/solutions-worker-impl.ts` — fetch URL pattern (`/solutions-${diceCount}d.mugbin`), worker-side logic
- `packages/ui/src/app/solutions.service.ts` — delegates to worker via `SOLUTIONS_WORKER_API` token, version checking on main thread
- `packages/ui/serve-solutions.js` — serves files from `SOLUTIONS_DIR` directory, matches `/solutions-\d+d\.mugbin`
- `packages/ui/proxy.conf.js` and `proxy.conf.json` — proxy route (`/solutions-*d.mugbin`)
- `packages/ui/playwright.config.ts` — `SOLUTIONS_DIR` env var pointing to playwright directory
- `packages/ui/playwright/global-setup.ts` — generates `solutions-3d.mugbin` in playwright directory via `--outputDir`
- `.github/workflows/publish.yml` — downloads `.mugbin` files from the `solutions-latest` GitHub Release, copies into build output before deploy
- Root `package.json` — `generate-all-solutions` script (user passes die sizes; default output dir is `solutions/`), `upload-solutions` and `create-solutions-release` scripts for managing the GitHub Release
- `packages/cli/src/main.ts` — CLI default `--outputDir` is `'solutions'`

### Solution deployment pipeline
Solution files are stored as GitHub Release assets (tag: `solutions-latest`), not in git:
- Generate locally with `npm run generate-all-solutions -- "10,10,10"` etc.
- First upload: `npm run create-solutions-release`
- Update: `npm run upload-solutions` (clobbers existing assets)
- `publish.yml` downloads from this release during CI deploy via `gh release download solutions-latest`
- If the release doesn't exist, the site deploys without precomputed solutions (UI falls back to local computation)

### Shared types between packages
- `packages/common/src/tokens.ts` exports `OPERATION_MASKS`, `OPERATION_TO_TOKEN`, `DB_VERSION`
- Both UI and CLI import these from `@muggins_calculator/common`
- After changing common source, **rebuild common** (`npm run build -w packages/common`) before running CLI tests

### Documentation
- When changing architecture, commands, or the mugbin format, update both `CLAUDE.md` and `README.md`
- `README.md` documents the mugbin format spec, UI optimization strategy, and CLI usage for end users

## Do NOT Use
- `NgModule` -- everything is standalone
- `@ngbracket/ngx-layout` (FlexLayout) -- use CSS flexbox
- `ngx-ui-scroll` -- use `@angular/cdk/scrolling`
- `sql.js-httpvfs` or SQLite -- use mugbin binary format
- Jest -- use Angular's built-in test runner
- Gulp -- use Angular CLI and npm scripts
- `devenv.sh` / Docker -- run commands directly
- Constructor injection -- use `inject()`
- `platformBrowserDynamic().bootstrapModule()` -- use `bootstrapApplication()`
