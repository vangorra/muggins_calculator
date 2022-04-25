import {expect, test} from '@playwright/test';
import {
  clickCloseOnAboutDialog,
  clickScrollToTopButton,
  clickToolbarAboutButton,
  clickToolbarConfigurationButton,
  expectSelectedFaces,
  getEquations,
  getJumpToSolutions,
  jumpToSolution,
  selectEquation,
  selectFaces, waitForCalculatorPage,
  waitForDataProcessedState,
  waitForNoneProcessedState
} from "./calculator.utils";
import {PATH_CALCULATOR} from "../const";
import {collectCoverage, initializePath, scrollToTop} from "../utils";
import {
  clickRemoveDieButton,
  clickToolbarCloseButton,
  getConfiguration,
  waitForConfigurationPage,
} from "./configuration.utils";
import {range} from "lodash";

const SELECT_FACES = [2, 3, 4];
const SCREENSHOT_DEFAULT_STARTUP = 'default_startup.png';
const SCREENSHOT_SELECTED_FACES = 'selected_faces_2_3_4.png';

test.describe.configure({ mode: 'parallel' });
collectCoverage();
initializePath(PATH_CALCULATOR, waitForCalculatorPage);

test('Defaults', async ({ page }) => {
  await waitForDataProcessedState(page);
  expect(await getEquations(page)).toEqual([
    "1 = 1 * (1 * 1)",
    "1 = 1 * (1 / 1)",
    "1 = 1 + (1 - 1)",
    "1 = 1 - (1 - 1)",
    "1 = 1 / (1 * 1)",
    "1 = 1 / (1 / 1)",
    "1 = (1 * 1) / 1",
    "1 = (1 + 1) - 1",
    "1 = (1 / 1) / 1",
    "2 = 1 * (1 + 1)",
    "2 = 1 + (1 * 1)",
    "2 = 1 + (1 / 1)",
    "2 = (1 + 1) / 1",
    "3 = 1 + (1 + 1)",
  ]);
  expect(await page.screenshot()).toMatchSnapshot({
    name: SCREENSHOT_DEFAULT_STARTUP,
  });
});

test('Select die faces. Confirm config persisted after reload.', async ({ page }) => {
  const expectedEquations = [
    "1 = 2 + (3 - 4)",
    "1 = 2 - (4 - 3)",
    "1 = 3 + (2 - 4)",
    "1 = 3 - (4 - 2)",
    "1 = 3 - (4 / 2)",
    "1 = (2 + 3) - 4",
    "2 = 2 * (4 - 3)",
    "2 = 2 / (4 - 3)",
    "2 = (2 * 3) - 4",
    "2 = (2 + 4) / 3",
    "3 = 2 + (4 - 3)",
    "3 = 2 - (3 - 4)",
    "3 = 4 + (2 - 3)",
    "3 = 4 - (3 - 2)",
    "3 = (2 + 4) - 3",
    "4 = 4 * (3 - 2)",
    "4 = 4 / (3 - 2)",
    "5 = 3 + (4 - 2)",
    "5 = 3 + (4 / 2)",
    "5 = 3 - (2 - 4)",
    "5 = 4 + (3 - 2)",
    "5 = 4 - (2 - 3)",
    "5 = (2 * 4) - 3",
    "5 = (3 + 4) - 2",
    "6 = 3 * (4 - 2)",
    "6 = 3 * (4 / 2)",
    "6 = 3 / (2 / 4)",
    "6 = 4 * (3 / 2)",
    "6 = 4 / (2 / 3)",
    "6 = (3 * 4) / 2",
    "9 = 2 + (3 + 4)",
    "9 = 3 + (2 + 4)",
    "9 = 4 + (2 + 3)",
    "10 = 4 + (2 * 3)",
    "10 = (3 * 4) - 2",
    "11 = 3 + (2 * 4)",
    "14 = 2 * (3 + 4)",
    "14 = 2 + (3 * 4)",
    "18 = 3 * (2 + 4)",
    "20 = 4 * (2 + 3)",
    "24 = 2 * (3 * 4)",
    "24 = 3 * (2 * 4)",
    "24 = 4 * (2 * 3)",
  ];

  await selectFaces(page, SELECT_FACES);
  expect(await getEquations(page)).toEqual(expectedEquations);
  expect(await page.screenshot()).toMatchSnapshot({
    name: SCREENSHOT_SELECTED_FACES,
  });

  // Confirm the selected faces persist across reloads.
  await page.reload();
  await waitForDataProcessedState(page);
  await expectSelectedFaces(page, SELECT_FACES);
  expect(await getEquations(page)).toEqual(expectedEquations);
  expect(await page.screenshot()).toMatchSnapshot({
    name: SCREENSHOT_SELECTED_FACES,
  });
});

test('Jump to selection and scroll to top.', async ({ page }) => {
  await selectFaces(page, [2, 3, 4]);

  const solutions = await getJumpToSolutions(page);
  expect(solutions).toEqual([
    1,
    2,
    3,
    4,
    5,
    6,
    9,
    10,
    11,
    14,
    18,
    20,
    24,
  ]);

  await jumpToSolution(page, 20);
  expect(await page.screenshot()).toMatchSnapshot({
    name: 'equation_solution_20.png'
  });
  await clickScrollToTopButton(page);

  // The button should be gone.
  expect(await page.screenshot()).toMatchSnapshot({
    name: SCREENSHOT_SELECTED_FACES,
  });
});

test('No results can be shown', async ({page}) => {
  await clickToolbarConfigurationButton(page);
  await waitForConfigurationPage(page);

  const initial = await getConfiguration(page);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const item of range(initial.dice.length - 1)) {
    await clickRemoveDieButton(page);
  }

  await scrollToTop(page);
  await clickToolbarCloseButton(page);
  await waitForNoneProcessedState(page);

  // The button should be gone.
  expect(await page.screenshot()).toMatchSnapshot({
    name: 'no_equations.png',
  });
});

test('Select equation highlights the list item.', async ({page}) => {
  await jumpToSolution(page, 2);
  await selectEquation(page, '2 = 1 + (1 * 1)');
  expect(await page.screenshot()).toMatchSnapshot({
    name: 'selected_equation.png',
  });
});

test('Open and close about dialog.', async ({ page }) => {
  await clickToolbarAboutButton(page);
  expect(await page.screenshot()).toMatchSnapshot({
    name: "open_dialog.png",
  });

  await clickCloseOnAboutDialog(page);
  expect(await page.screenshot()).toMatchSnapshot({
    name: SCREENSHOT_DEFAULT_STARTUP,
  });
});