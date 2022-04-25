import { expect, Page } from '@playwright/test';
import { forEachLocator, mapLocator, waitForAnimationToSettle } from '../utils';
import { cloneDeep, range } from 'lodash';
import {
  Configuration,
  DieConfiguration,
  THEME_CONFIGS,
  ThemeEnum,
} from '../../src/app/general_types';
import { OperationEnum, OPERATIONS_MAP } from '../../src/app/solver/solver';

export const MIN_SIZE_QUERY =
  'app-configuration [formgroupname="board"] [formcontrolname="minSize"]';
export const MAX_SIZE_QUERY =
  'app-configuration [formgroupname="board"] [formcontrolname="maxSize"]';
export const FACE_COUNT_QUERY =
  'app-configuration [formArrayName="dice"] input[formcontrolname="faceCount"]';
const selectedFaceQuery =
  'app-configuration [formArrayName="dice"] input[formcontrolname="selectedFace"]';

export const sortOperations = (
  operations: OperationEnum[]
): OperationEnum[] => {
  const sortedOperations = [...operations];
  sortedOperations.sort();
  return sortedOperations;
};

export const standardizeConfiguration = (
  configuration: Configuration
): Configuration => {
  return {
    ...cloneDeep(configuration),
    operations: sortOperations(configuration.operations),
  };
};

export const waitForConfigurationPage = async (page: Page) => {
  await page.waitForSelector('app-configuration');
  await waitForAnimationToSettle();
};

export const clickToolbarCloseButton = async (page: Page) => {
  await page
    .locator(
      'app-toolbar button[data-test-id="app-configuration_toolbar_closeButton"]'
    )
    .click();
  await page.waitForSelector('app-configuration', {
    state: 'detached',
  });
  await page.waitForSelector('app-configuration', { state: 'detached' });
  await page.waitForSelector('app-calculator');
  await waitForAnimationToSettle();
};

export const clickResetToDefaultsButton = async (page: Page) => {
  await page
    .locator(
      'app-configuration [data-test-id="app-configuration_resetToDefaults"]'
    )
    .click();
};

export const getTheme = async (page: Page): Promise<ThemeEnum> => {
  const selected = await page.locator(
    'app-configuration [formcontrolname="theme"] .mat-list-single-selected-option'
  );
  const value = await selected.getAttribute('data-value');

  const matchingTheme = THEME_CONFIGS.map((config) => config.theme).find(
    (theme) => theme === value
  );

  expect(matchingTheme).toBeTruthy();

  return matchingTheme as ThemeEnum;
};

export const setTheme = async (page: Page, theme: ThemeEnum) => {
  await page
    .locator(
      `app-configuration [formcontrolname="theme"] [data-value="${theme}"]`
    )
    .click();
  await waitForAnimationToSettle();
  expect(await getTheme(page)).toEqual(theme);
};

export const getOperations = async (page: Page): Promise<OperationEnum[]> => {
  const operations = sortOperations(
    await mapLocator(
      page.locator(
        'app-configuration [formcontrolname="operations"] [aria-selected="true"]'
      ),
      (itemLocator) => itemLocator.getAttribute('data-value')
    )
  );

  operations.forEach((operation) =>
    expect(OPERATIONS_MAP[operation]).toBeTruthy()
  );
  return operations;
};

export const setOperations = async (
  page: Page,
  operations: OperationEnum[]
) => {
  await forEachLocator(
    page.locator(
      'app-configuration [formcontrolname="operations"] mat-list-option'
    ),
    async (itemLocator) => {
      const isSelected =
        (await itemLocator.getAttribute('aria-selected')) === 'true';
      const value = (await itemLocator.getAttribute('data-value')) as string;
      const shouldBeSelected = operations.includes(value as OperationEnum);
      const shouldClick =
        (!isSelected && shouldBeSelected) || (isSelected && !shouldBeSelected);
      if (shouldClick) {
        await itemLocator.click();
        await waitForAnimationToSettle();
      }
    }
  );

  expect(await getOperations(page)).toEqual(sortOperations(operations));
};

export const getBoardSize = async (page: Page) => {
  const minSize = await page.locator(MIN_SIZE_QUERY).inputValue();
  const maxSize = await page.locator(MAX_SIZE_QUERY).inputValue();

  expect(isNaN(minSize as any)).toBeFalsy();
  expect(isNaN(maxSize as any)).toBeFalsy();

  return {
    minSize: +minSize,
    maxSize: +maxSize,
  };
};

export const setBoardMinSize = async (page: Page, size: number) => {
  const { maxSize } = await getBoardSize(page);
  await page.locator(MIN_SIZE_QUERY).fill(size + '');
  expect(await getBoardSize(page)).toEqual({
    minSize: size,
    maxSize,
  });
};

export const setBoardMaxSize = async (page: Page, size: number) => {
  const { minSize } = await getBoardSize(page);
  await page.locator(MAX_SIZE_QUERY).fill(size + '');
  expect(await getBoardSize(page)).toEqual({
    minSize,
    maxSize: size,
  });
};

export const getDice = async (page: Page): Promise<DieConfiguration[]> => {
  const faceCountArr = await mapLocator(
    await page.locator(FACE_COUNT_QUERY),
    (itemLocator) => itemLocator.inputValue()
  );

  const selectedFaceArr = await mapLocator(
    await page.locator(selectedFaceQuery),
    (itemLocator) => itemLocator.inputValue()
  );

  expect(faceCountArr.length).toEqual(selectedFaceArr.length);

  return faceCountArr.map((faceCount, index) => {
    const selectedFace = selectedFaceArr[index];
    expect(isNaN(faceCount)).toBeFalsy();
    expect(isNaN(selectedFace)).toBeFalsy();

    return {
      faceCount: +faceCount,
      selectedFace: +selectedFace,
    };
  });
};

export const getConfiguration = async (page: Page): Promise<Configuration> => {
  return standardizeConfiguration({
    theme: await getTheme(page),
    operations: await getOperations(page),
    board: await getBoardSize(page),
    dice: await getDice(page),
  });
};

export const setDieFaceCount = async (
  page: Page,
  dieIndex: number,
  faceCount: number
) => {
  const initial = await getDice(page);
  await page
    .locator(FACE_COUNT_QUERY)
    .nth(dieIndex)
    .fill(faceCount + '');

  const expected = cloneDeep(initial);
  (expected as any)[dieIndex].faceCount = faceCount;
  expect(await getDice(page)).toEqual(expected);
};

export const clickAddDieButton = async (page: Page) => {
  const diceConfigInitial = await getDice(page);
  await page
    .locator('app-configuration [formArrayName="dice"] button.addDie')
    .click();
  await page.waitForFunction(
    (diceCount) =>
      diceCount ===
      document.querySelectorAll(
        '[formArrayName="dice"] input[formcontrolname="faceCount"]'
      ).length,
    diceConfigInitial.length + 1
  );
  expect(await getDice(page)).toEqual(
    diceConfigInitial.concat({
      faceCount: 6,
      selectedFace: 1,
    })
  );
};

export const clickRemoveDieButton = async (page: Page) => {
  const diceConfigInitial = await getDice(page);
  await page
    .locator('app-configuration [formArrayName="dice"] button.removeDie')
    .click();
  await page.waitForFunction(
    (diceCount) =>
      diceCount ===
      document.querySelectorAll(
        '[formArrayName="dice"] input[formcontrolname="faceCount"]'
      ).length,
    diceConfigInitial.length - 1
  );
  expect(await getDice(page)).toEqual(diceConfigInitial.slice(0, -1));
};

export const setDice = async (page: Page, dice: DieConfiguration[]) => {
  const currentDice = await getDice(page);
  const countDiff = dice.length - currentDice.length;
  for (const index of range(Math.abs(countDiff))) {
    if (countDiff > 0) {
      await clickAddDieButton(page);
    } else {
      await clickRemoveDieButton(page);
    }
  }

  for (let index = 0; index < dice.length; index += 1) {
    const die = dice[index];
    await setDieFaceCount(page, index, die.faceCount);
  }

  expect(await getDice(page)).toEqual(dice);
};

export const setConfiguration = async (
  page: Page,
  configuration: Configuration
) => {
  await setTheme(page, configuration.theme);
  await setOperations(page, configuration.operations);
  await setBoardMinSize(page, configuration.board.minSize);
  await setBoardMaxSize(page, configuration.board.maxSize);
  await setDice(page, configuration.dice);
};
