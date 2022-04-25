import {
  clickConfirmDialogAcceptButton,
  clickConfirmDialogRejectButton,
  collectCoverage,
  initializePath,
  scrollToQuerySelector, waitForAnimationToSettle
} from "../utils";
import {expect, test} from "@playwright/test";
import {PATH_CONFIGURATION} from "../const";
import {
  clickResetToDefaultsButton, FACE_COUNT_QUERY,
  getConfiguration, MAX_SIZE_QUERY, MIN_SIZE_QUERY,
  setBoardMaxSize,
  setBoardMinSize,
  setConfiguration,
  setDice,
  setOperations,
  setTheme,
  standardizeConfiguration,
  waitForConfigurationPage
} from "./configuration.utils";
import {DEFAULT_CONFIGURATION} from "../../src/app/const";
import {ThemeEnum} from "../../src/app/general_types";
import {OperationEnum, OPERATIONS} from "../../src/app/solver/solver";

const SCREENSHOT_DEFAULT_STARTUP = "default_startup.png";

test.describe.configure({ mode: 'parallel' });
collectCoverage();
initializePath(PATH_CONFIGURATION, waitForConfigurationPage);

test("Defaults", async ({ page }) => {
  expect(await getConfiguration(page)).toEqual(standardizeConfiguration(DEFAULT_CONFIGURATION));
  expect(await page.screenshot()).toMatchSnapshot({
    name: SCREENSHOT_DEFAULT_STARTUP,
  });
});

const testThemeChange = (toTheme: ThemeEnum) => {
  test(`Change theme to ${toTheme}`, async ({ page }) => {
    const screenshotName = `change_theme_to_${toTheme}.png`;
    const expectNewConfiguration = standardizeConfiguration({
      ...DEFAULT_CONFIGURATION,
      theme: toTheme,
    });

    await setTheme(page, toTheme);
    expect(await getConfiguration(page)).toEqual(expectNewConfiguration);
    expect(await page.screenshot()).toMatchSnapshot({
      name: screenshotName,
    });

    // Ensure setting is persisted across reload.
    await page.reload();
    await waitForConfigurationPage(page);
    expect(await getConfiguration(page)).toEqual(expectNewConfiguration);
    expect(await page.screenshot()).toMatchSnapshot({
      name: screenshotName,
    });
  });
};

testThemeChange(ThemeEnum.DARK);
testThemeChange(ThemeEnum.LIGHT);
testThemeChange(ThemeEnum.AUTOMATIC);

const testSetOperations = (operations: OperationEnum[]) => {
  test(`Change operations to '${operations.join(', ')}'.`, async ({ page }) => {
    const screenshotName = `change_operations_to_${operations.join('_')}.png`;
    const expectNewConfiguration = standardizeConfiguration({
      ...DEFAULT_CONFIGURATION,
      operations,
    });

    await setOperations(page, operations);
    expect(await getConfiguration(page)).toEqual(expectNewConfiguration);

    // Ensure setting is persisted across reload.
    await page.reload();
    await waitForConfigurationPage(page);
    await scrollToQuerySelector(page, 'app-configuration .operations', "start");
    expect(await getConfiguration(page)).toEqual(expectNewConfiguration);
    expect(await page.screenshot()).toMatchSnapshot({
      name: screenshotName,
    });
  });
};

testSetOperations([OperationEnum.MODULO, OperationEnum.ROOT, OperationEnum.POWER]);
testSetOperations([OperationEnum.PLUS, OperationEnum.MULTIPLY, OperationEnum.ROOT]);
testSetOperations(OPERATIONS.map((op) => op.id));

test("Change board size", async ({ page }) => {
  await setBoardMinSize(page, 3);
  await setBoardMaxSize(page, 20);

  // Ensure setting is persisted across reload.
  await page.reload();
  await waitForConfigurationPage(page);
  expect(await getConfiguration(page)).toEqual(standardizeConfiguration({
    ...DEFAULT_CONFIGURATION,
    board: {
      minSize: 3,
      maxSize: 20,
    },
  }));
  await scrollToQuerySelector(page, 'app-configuration .boardSize', "start");
  expect(await page.screenshot()).toMatchSnapshot({
    name: "change_board_size.png",
  });
});

test("Change dice", async ({ page }) => {
  await setDice(page, [
    {
      faceCount: 1,
      selectedFace: 1,
    },
    {
      faceCount: 2,
      selectedFace: 1,
    },
    {
      faceCount: 3,
      selectedFace: 1,
    },
    {
      faceCount: 4,
      selectedFace: 1,
    }
  ]);
  // Ensure setting is persisted across reload.
  await page.reload();
  await scrollToQuerySelector(page, 'app-configuration .dice', "start");
  expect(await page.screenshot()).toMatchSnapshot({
    name: "change_dice_before.png",
  });

  await setDice(page, [
    {
      faceCount: 5,
      selectedFace: 1,
    },
    {
      faceCount: 4,
      selectedFace: 1,
    }
  ]);
  // Ensure setting is persisted across reload.
  await page.reload();
  await scrollToQuerySelector(page, 'app-configuration .dice', "start");
  expect(await page.screenshot()).toMatchSnapshot({
    name: "change_dice_after.png",
  });
});

const testTextSelectAll = (screenshotName: string, query: string, nthIndex: number = 0) => {
  test(`Click on text field with query '${query}'[${nthIndex}] selects all.`, async ({ page }) => {
    await scrollToQuerySelector(page, query, "start");
    await page.locator(query).nth(nthIndex).click();
    await waitForAnimationToSettle();
    expect(await page.screenshot()).toMatchSnapshot({
      name: screenshotName,
    });
  });
};

testTextSelectAll('board_min_face_select_all.png', MIN_SIZE_QUERY);
testTextSelectAll('board_max_face_select_all.png', MAX_SIZE_QUERY);
testTextSelectAll('face_count_select_all_0.png', FACE_COUNT_QUERY, 0);
testTextSelectAll('face_count_select_all_1.png', FACE_COUNT_QUERY, 1);
testTextSelectAll('face_count_select_all_2.png', FACE_COUNT_QUERY, 2);

test("Set configuration and reset to defaults.", async ({ page }) => {
  const configuration = {
    theme: ThemeEnum.DARK,
    operations: [
      OperationEnum.MODULO,
      OperationEnum.POWER,
    ],
    board: {
      minSize: 5,
      maxSize: 10,
    },
    dice: [
      {
        faceCount: 7,
        selectedFace: 1,
      },
      {
        faceCount: 4,
        selectedFace: 1,
      },
      {
        faceCount: 2,
        selectedFace: 1,
      }
    ],
  };
  await setConfiguration(page, configuration);
  await clickResetToDefaultsButton(page);
  await clickConfirmDialogRejectButton(page);
  expect(await getConfiguration(page)).toEqual(standardizeConfiguration(configuration));
  await page.reload();
  await waitForConfigurationPage(page);
  expect(await getConfiguration(page)).toEqual(standardizeConfiguration(configuration));

  await clickResetToDefaultsButton(page);
  await clickConfirmDialogAcceptButton(page);
  expect(await getConfiguration(page)).toEqual(standardizeConfiguration(DEFAULT_CONFIGURATION));

  await page.reload();
  await waitForConfigurationPage(page);
  expect(await getConfiguration(page)).toEqual(standardizeConfiguration(DEFAULT_CONFIGURATION));
});
