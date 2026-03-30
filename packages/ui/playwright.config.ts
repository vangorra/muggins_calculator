import { PlaywrightTestConfig } from '@playwright/test';
import path from 'path';

const baseUrl = new URL('http://localhost:4200');
const solutionsPort = 4251;
const testSolutionsDir = path.resolve(__dirname, 'playwright');

const config: PlaywrightTestConfig = {
  globalSetup: './playwright/global-setup.ts',
  testDir: path.resolve(__dirname, './playwright/tests'),
  reporter: [[process.env.CI ? 'github' : 'line']],
  maxFailures: 1,
  snapshotPathTemplate:
    '{testDir}/{testFileName}-snapshots/{projectName}/{arg}-{platform}{ext}',
  expect: {
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.05,
    },
  },
  use: {
    baseURL: baseUrl.toString(),
    headless: true,
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'mobile',
      use: { viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: [
    {
      command: `node serve-solutions.js`,
      url: `http://localhost:${solutionsPort}/health`,
      cwd: path.resolve(__dirname),
      reuseExistingServer: !process.env['CI'],
      env: {
        SOLUTIONS_DIR: testSolutionsDir,
        SOLUTIONS_PORT: String(solutionsPort),
      },
    },
    {
      command: `npx ng serve --configuration production`,
      url: baseUrl.toString(),
      cwd: path.resolve(__dirname),
      ignoreHTTPSErrors: true,
      reuseExistingServer: !process.env['CI'],
      timeout: 120000,
      env: {
        SOLUTIONS_PORT: String(solutionsPort),
      },
    },
  ],
};
export default config;
