import { expect, Page } from '@playwright/test';
import {
  forEachLocator,
  getScrollY,
  waitForAnimationToSettle,
  waitForScrollY,
} from '../utils';

export const waitForCalculatorPage = async (page: Page) => {
  await page.waitForSelector('app-calculator');
  await waitForAnimationToSettle();
};

export const waitForDataProcessedState = async (page: Page) => {
  await page.waitForSelector('.results .data.processedState');
  await waitForAnimationToSettle();
};

export const waitForNoneProcessedState = async (page: Page) => {
  await page.waitForSelector('.results .none.processedState');
  await waitForAnimationToSettle();
};

export const waitForLoadingState = async (page: Page) => {
  await page.waitForSelector('.results .loading');
  await waitForAnimationToSettle();
};

export const getDice = async (page: Page) => {
  const appDice = await page.locator('app-die');
  const diceCount = await appDice.count();

  const dice: { faceCount: number; selectedFace: number }[] = [];
  for (let dieIndex = 0; dieIndex < diceCount; dieIndex += 1) {
    const die = appDice.nth(dieIndex);
    const selectedDieContent = await die
      .locator('mat-button-toggle.mat-button-toggle-checked')
      .textContent();
    expect(selectedDieContent).toBeTruthy();

    const lastDieContent = await die
      .locator('mat-button-toggle')
      .last()
      .textContent();
    expect(lastDieContent).toBeTruthy();

    dice.push({
      faceCount: +lastDieContent!,
      selectedFace: +selectedDieContent!,
    });
  }

  return dice;
};

export const getEquations = async (page: Page) => {
  await waitForDataProcessedState(page);

  const listOptions = await page.locator(
    '.results .data mat-list-option.equation [appmathjax]'
  );
  const listOptionsCount = await listOptions.count();

  const equations: string[] = [];
  for (let index = 0; index < listOptionsCount; index += 1) {
    const listOption = await listOptions.nth(index);
    const equation = await listOption.getAttribute('data-equation');
    equations.push(equation!);
  }

  return equations;
};

export const getSelectedEquations = async (page: Page) => {
  await waitForDataProcessedState(page);

  const equations: string[] = [];
  await forEachLocator(
    page.locator(
      `.results .data mat-list-option.equation[aria-selected="true"] [data-equation]`
    ),
    async (listOption) => {
      const equation = await listOption.getAttribute('data-equation');
      equations.push(equation!);
    }
  );

  return equations;
};

export const setEquationSelectedState = async (
  page: Page,
  targetEquations: string[],
  targetState: boolean
) => {
  await waitForDataProcessedState(page);

  // Confirm the target equations are present.
  const equations = await getEquations(page);
  targetEquations.forEach((equation) => expect(equations).toContain(equation));

  const selectedEquationsBefore = await getSelectedEquations(page);
  for (const selectEquation of targetEquations) {
    const listOption = await page.locator(
      `.results .data mat-list-option.equation [data-equation="${selectEquation}"]`
    );
    const equation = await listOption.getAttribute('data-equation');

    const currentState = selectedEquationsBefore.indexOf(equation!) > -1;
    if (currentState != targetState) {
      await listOption.click();
    }
  }

  const selectedEquations = await getSelectedEquations(page);
  targetEquations.forEach((equation) => {
    let ex = expect(selectedEquations);
    if (!targetState) {
      ex = ex.not;
    }

    ex.toContain(equation);
  });

  await waitForAnimationToSettle();
};

export const deSelectEquations = async (page: Page, toSelect: string[]) => {
  return setEquationSelectedState(page, toSelect, false);
};

export const selectEquations = async (page: Page, toSelect: string[]) => {
  return setEquationSelectedState(page, toSelect, true);
  //
  // await waitForDataProcessedState(page);
  //
  // const equations = await getEquations(page);
  // toSelect.forEach((equation) => expect(equations).toContain(equation));
  //
  // const selectedEquationsBefore = await getSelectedEquations(page);
  // for (const selectEquation of toSelect) {
  //   const listOption = await page.locator(
  //     `.results .data mat-list-option.equation [data-equation="${selectEquation}"]`
  //   );
  //   const equation = await listOption.getAttribute('data-equation');
  //
  //   if (equation! in selectedEquationsBefore) {
  //     continue;
  //   }
  //
  //   await listOption.click();
  // }
  //
  // const selectedEquations = await getSelectedEquations(page);
  // expect(selectedEquations).toEqual(toSelect);
  //
  // await waitForAnimationToSettle();
};

export const expectSelectedFaces = async (page: Page, faces: number[]) => {
  const dice = await getDice(page);
  const selectedFaces = dice.map(({ selectedFace }) => selectedFace);
  expect(selectedFaces).toEqual(faces);
};

export const selectFaces = async (page: Page, faces: number[]) => {
  for (let dieIndex = 0; dieIndex < faces.length; dieIndex += 1) {
    const face = faces[dieIndex];
    await page
      .locator(
        `[data-test-id="app-dice_app-die_${dieIndex}"] button:has-text("${face}")`
      )
      .click();
    await waitForLoadingState(page);
    await waitForDataProcessedState(page);
  }

  await expectSelectedFaces(page, faces);
  await waitForAnimationToSettle();
};

export const getJumpToSolutions = async (page: Page) => {
  await waitForDataProcessedState(page);

  const buttons = await page.locator('.results button.jumpToSolutionButton');
  const buttonsCount = await buttons.count();

  const solutions: number[] = [];
  for (let index = 0; index < buttonsCount; index += 1) {
    const text = await buttons.nth(index).innerText();
    solutions.push(+text.trim());
  }
  return solutions;
};

export const jumpToSolution = async (page: Page, solution: number) => {
  await waitForDataProcessedState(page);

  await page.locator(`[data-test-id="jumpTo_${solution}"]`).click();
  await waitForAnimationToSettle();
  expect(await getScrollY(page)).toBeGreaterThan(0);
};

export const clickScrollToTopButton = async (page: Page) => {
  const buttonQuery = '[data-test-id="app-scroll-to-top_scrollToTopButton"]';
  const button = await page.waitForSelector(buttonQuery);
  await button.click();

  await waitForScrollY(page, 0);
  await page.waitForSelector(buttonQuery, {
    state: 'detached',
  });
};

export const clickToolbarConfigurationButton = async (page: Page) => {
  await page
    .locator(
      'app-toolbar [data-test-id="app-calculator_toolbar_configurationButton"]'
    )
    .click();
  await page.waitForSelector('app-calculator', { state: 'detached' });
  await page.waitForSelector('app-configuration');
  await waitForAnimationToSettle();
};

export const clickToolbarAboutButton = async (page: Page) => {
  await page
    .locator('app-toolbar [data-test-id="app-calculator_toolbar_aboutButton"]')
    .click();
  await page.waitForSelector('app-about-dialog');
  await waitForAnimationToSettle();
};

export const clickCloseOnAboutDialog = async (page: Page) => {
  await page.locator('app-about-dialog [mat-dialog-close]').click();
  await page.waitForSelector('app-about-dialog', {
    state: 'detached',
  });
  await waitForAnimationToSettle();
};
