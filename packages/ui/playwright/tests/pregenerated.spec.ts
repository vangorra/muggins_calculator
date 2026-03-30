import { expect, test } from '@playwright/test';
import {
  selectFaces,
  waitForCalculatorPage,
  waitForDataProcessedState,
} from './calculator.utils';
import { PATH_CALCULATOR } from '../const';
import { initializePath } from '../utils';

// The test solutions DB is generated with --dieSize "3,3,3", meaning 3 dice
// with faces {1,2,3}. Valid face combinations are all multisets of size 3 from
// {1,2,3}, e.g. [1,1,1], [1,2,3], [2,3,3]. Any face value > 3 is not in the DB.

test.describe.configure({ mode: 'parallel' });
initializePath(PATH_CALCULATOR, waitForCalculatorPage);

test('uses pre-generated solutions when faces are in DB', async ({ page }) => {
  // Default is 3 dice with face 1 selected each → facesKey "1,1,1" → in test DB.
  await waitForDataProcessedState(page);

  await expect(page.locator('.fallback-warning')).not.toBeVisible();
  expect(await page.screenshot()).toMatchSnapshot({
    name: 'pregenerated_faces_1_1_1.png',
  });
});

test('falls back to local computation when faces are not in DB', async ({ page }) => {
  // Face value 4 exceeds the max face (3) in the test DB → not in DB → fallback.
  await selectFaces(page, [1, 1, 4]);
  await waitForDataProcessedState(page);

  await expect(page.locator('.fallback-warning')).toBeVisible();
  expect(await page.screenshot()).toMatchSnapshot({
    name: 'pregenerated_fallback_faces_1_1_4.png',
  });
});
