import {FullConfig} from '@playwright/test';
import {generateCoverageReports} from "./utils";

async function globalTeardown(config: FullConfig) {
  await generateCoverageReports();
}

export default globalTeardown;
