import { expect, Locator, Page, test } from '@playwright/test';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { PATH_COVERAGE } from './const';
import { generateMergedCoverageReports } from '../lib/istabul.utils';
import * as path from 'path';
import { filePathExists, rmIfExists } from '../lib/fs.utils';

export const localStorageClear = async (page: Page) => {
  await page.evaluate(() => {
    localStorage.clear();
  });
};

export const initializePath = (
  urlPath: string,
  waitFor: (page: Page) => Promise<void>
) => {
  test.beforeEach(async ({ page }) => {
    await page.goto(urlPath);
    await localStorageClear(page);
    await page.reload();
    await waitFor(page);
  });
};

export const sleep = (millis: number) =>
  new Promise((res) => setTimeout(res, millis));

export const waitForAnimationToSettle = async () => sleep(1000);

export const getScrollY = async (page: Page) => {
  const scrollY: any = await page.evaluate(() => window.scrollY);
  return +scrollY;
};

export const waitForScrollY = async (page: Page, expectScrollY: number) => {
  await page.waitForFunction(
    async (scrollY) => window.scrollY === scrollY,
    expectScrollY
  );
};

export const scrollToTop = async (page: Page) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitForScrollY(page, 0);
};

export const scrollToQuerySelector = async (
  page: Page,
  querySelector: string,
  block: ScrollLogicalPosition = 'center'
) => {
  await page.waitForSelector(querySelector);
  await page.evaluate(
    ([query, bl]) => {
      document.querySelector(query)?.scrollIntoView({ block: bl as any });
    },
    [querySelector, block]
  );
  await waitForAnimationToSettle();
};

export const clickConfirmDialogRejectButton = async (page: Page) => {
  await page.locator('app-confirm-dialog button.rejectButton').click();
  await page.waitForSelector('app-confirm-dialog', { state: 'detached' });
  await waitForAnimationToSettle();
};

export const clickConfirmDialogAcceptButton = async (page: Page) => {
  await page.locator('app-confirm-dialog button.acceptButton').click();
  await page.waitForSelector('app-confirm-dialog', { state: 'detached' });
  await waitForAnimationToSettle();
};

export const forEachLocator = async (
  itemsLocator: Locator,
  handler: (itemLocator: Locator) => Promise<void>
) => {
  const count = await itemsLocator.count();

  for (let index = 0; index < count; index += 1) {
    const locator = await itemsLocator.nth(index);
    await handler(locator);
  }
};

export const mapLocator = async (
  itemsLocator: Locator,
  handler: (itemLocator: Locator) => Promise<any>
) => {
  const items: any[] = [];

  const forEachHandler = async (locator: Locator) => {
    items.push(await handler(locator));
  };

  await forEachLocator(itemsLocator, forEachHandler);

  return items;
};

export const cleanCodeCoverageFiles = async () => {
  await rmIfExists(PATH_COVERAGE, { recursive: true });
  await fs.promises.mkdir(PATH_COVERAGE, { recursive: true });
};

export const generateUUID = () => crypto.randomBytes(16).toString('hex');

export const collectCoverage = () => {
  test.afterEach(async ({ page }) => {
    const coverageMap = await page.evaluate(() => (window as any).__coverage__);
    expect(coverageMap).toBeTruthy();

    await fs.promises.writeFile(
      path.resolve(PATH_COVERAGE, `coverage_${generateUUID()}.json`),
      JSON.stringify(coverageMap, null, 2)
    );
  });
};

export const generateCoverageReports = async () => {
  await generateMergedCoverageReports(
    [path.resolve(PATH_COVERAGE, 'coverage_*.json')],
    PATH_COVERAGE,
    ['html', 'json', 'lcovonly']
  );
};
