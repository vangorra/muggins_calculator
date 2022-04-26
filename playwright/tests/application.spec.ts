import { test, expect } from '@playwright/test';
import { collectCoverage, initializePath } from '../utils';
import { PATH_CALCULATOR, PATH_CONFIGURATION } from '../const';
import { waitForConfigurationPage } from './configuration.utils';
import { STORAGE_KEY_404_REDIRECT_PATH } from '../../src/app/const';
import { waitForCalculatorPage } from './calculator.utils';

test.describe.configure({ mode: 'parallel' });
collectCoverage();
initializePath(PATH_CALCULATOR, waitForCalculatorPage);

test('Redirect when 404 local storage is set.', async ({ page }) => {
  await page.evaluate(
    ([key, path]) => {
      localStorage.setItem(key, path);
    },
    [STORAGE_KEY_404_REDIRECT_PATH, PATH_CONFIGURATION]
  );

  await page.reload();
  await waitForConfigurationPage(page);

  const value = await page.evaluate(
    ([key]) => localStorage.getItem(key),
    STORAGE_KEY_404_REDIRECT_PATH
  );
  expect(value).toBeFalsy();
});
