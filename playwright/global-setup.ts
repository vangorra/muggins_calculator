import {FullConfig} from '@playwright/test';
import {cleanCodeCoverageFiles} from "./utils";

async function globalSetup(config: FullConfig) {
  await cleanCodeCoverageFiles();
}

export default globalSetup;
