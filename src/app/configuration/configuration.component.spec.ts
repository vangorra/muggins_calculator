import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationComponent } from './configuration.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfigurationService } from '../configuration.service';
import { MatRadioModule } from '@angular/material/radio';
import { DieConfiguration, ThemeEnum } from '../general_types';
import { OperationEnum } from '../solver/solver';
import { DEFAULT_CONFIGURATION, DEFAULT_DIE_SELECTED_FACE } from '../const';
import { getByText, getByTitle } from '@testing-library/dom';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { MathJaxModule } from '../math-jax/math-jax.module';
import { MathJaxState } from '../math-jax/math-jax.service';
import { mockMathJaxProvider } from '../test-utils';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import SpyInstance = jest.SpyInstance;
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe(ConfigurationComponent.name, () => {
  let component: ConfigurationComponent;
  let fixture: ComponentFixture<ConfigurationComponent>;
  let element: HTMLElement;
  let configurationService: ConfigurationService;
  let configurationSaveSpy: SpyInstance;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MathJaxModule.withConfig(),
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([]),
        MatDialogModule,
        MatCardModule,
        MatSelectModule,
        MatListModule,
        MatInputModule,
        NoopAnimationsModule,
        MatRadioModule,
        MatIconModule,
        FlexLayoutModule,
        MatSnackBarModule,
      ],
      declarations: [ConfigurationComponent],
      providers: [mockMathJaxProvider(MathJaxState.initialized)],
    }).compileComponents();
  });

  beforeEach(() => {
    configurationService = TestBed.inject(ConfigurationService);
    configurationService.resetToDefaults();
    configurationService.save();
    configurationSaveSpy = jest.spyOn(configurationService, 'save');

    fixture = TestBed.createComponent(ConfigurationComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    fixture.detectChanges();
  });

  test('change theme', () => {
    const getOptionWithText = (text: string) =>
      Array.from(element.querySelectorAll('.theme mat-list-option')).find(
        (el) => (el as HTMLElement).textContent?.trim() === text
      ) as HTMLElement;

    const expectSelectedTheme = (
      theme: ThemeEnum,
      text: string,
      expectSave = true
    ) => {
      const selectedListOptions = element.querySelectorAll(
        '.theme .mat-list-single-selected-option'
      ) as NodeListOf<HTMLElement>;
      const selectedRadioOptions = element.querySelectorAll(
        '.theme mat-radio-button.mat-radio-checked'
      ) as NodeListOf<HTMLElement>;

      expect(selectedListOptions.length).toEqual(1);
      expect(selectedRadioOptions.length).toEqual(1);

      const selectedListOption = selectedListOptions[0];
      const selectedRadioOption = selectedRadioOptions[0];

      expect(configurationService.value.getValue().theme).toEqual(theme);
      expect(selectedListOption.textContent?.trim()).toEqual(text);
      expect(selectedRadioOption.textContent?.trim()).toEqual(text);

      if (expectSave) {
        expect(configurationSaveSpy).toHaveBeenCalled();
      } else {
        expect(configurationSaveSpy).not.toHaveBeenCalled();
      }
      configurationSaveSpy.mockClear();
    };

    // Check initial.
    expect(component.configurationSubscription?.closed).toBeFalsy();
    expectSelectedTheme(ThemeEnum.AUTOMATIC, 'Automatic', false);

    // Select dark theme.
    getOptionWithText('Dark')?.click();
    fixture.detectChanges();
    expectSelectedTheme(ThemeEnum.DARK, 'Dark');

    // Select light theme.
    getOptionWithText('Light')?.click();
    fixture.detectChanges();
    expectSelectedTheme(ThemeEnum.LIGHT, 'Light');

    // Select automatic theme.
    getOptionWithText('Automatic')?.click();
    fixture.detectChanges();
    expectSelectedTheme(ThemeEnum.AUTOMATIC, 'Automatic');
  });

  test('change operations', () => {
    const getOptionWithText = (text: string) =>
      Array.from(element.querySelectorAll('.operations mat-list-option')).find(
        (el) => el.querySelector('.operationName')?.textContent?.trim() === text
      ) as HTMLElement;

    const expectSelectedOperations = (
      operations: OperationEnum[],
      expectSave = true
    ) => {
      const selectedOperations = Array.from(
        element.querySelectorAll(
          '.operations mat-list-option[aria-selected="true"]'
        )
      ).map((el) => el.getAttribute('ng-reflect-value'));

      expect(selectedOperations).toEqual(operations);
      expect(configurationService.value.getValue().operations).toEqual(
        operations
      );

      if (expectSave) {
        expect(configurationSaveSpy).toHaveBeenCalled();
      } else {
        expect(configurationSaveSpy).not.toHaveBeenCalled();
      }
      configurationSaveSpy.mockClear();
    };

    const expectToggleWithText = (text: string, toggleBack = true) => {
      const option = getOptionWithText(text);
      expect(option).toBeTruthy();

      const value = option.getAttribute('ng-reflect-value') as OperationEnum;
      expect(value).toBeTruthy();

      const isOnInConfig = () =>
        configurationService.value.getValue().operations.indexOf(value) > -1;
      const isInitiallyOn = isOnInConfig();

      // Check initial.
      expect(option.getAttribute('aria-selected')).toEqual(
        isInitiallyOn ? 'true' : 'false'
      );

      // Toggle one way.
      option.click();
      fixture.detectChanges();
      expect(isOnInConfig()).toEqual(!isInitiallyOn);
      expect(option.getAttribute('aria-selected')).toEqual(
        isInitiallyOn ? 'false' : 'true'
      );

      // Toggle back.
      if (toggleBack) {
        option.click();
        fixture.detectChanges();
        expect(isOnInConfig()).toEqual(isInitiallyOn);
        expect(option.getAttribute('aria-selected')).toEqual(
          isInitiallyOn ? 'true' : 'false'
        );
      }
    };

    // Check initial.
    expectSelectedOperations(DEFAULT_CONFIGURATION.operations, false);

    // Toggle options.
    expectToggleWithText('Plus');
    expectToggleWithText('Minus');
    expectToggleWithText('Multiply');
    expectToggleWithText('Divide');
    expectToggleWithText('Power');
    expectToggleWithText('Root');
    expectToggleWithText('Modulo');

    // Set some options.
    expectToggleWithText('Root', false);
    expectSelectedOperations([
      OperationEnum.PLUS,
      OperationEnum.MINUS,
      OperationEnum.MULTIPLY,
      OperationEnum.DIVIDE,
      OperationEnum.ROOT,
    ]);

    expectToggleWithText('Plus', false);
    expectSelectedOperations([
      OperationEnum.MINUS,
      OperationEnum.MULTIPLY,
      OperationEnum.DIVIDE,
      OperationEnum.ROOT,
    ]);
  });

  test('change board size', () => {
    const minSizeElement = element.querySelector(
      '.boardSize [formcontrolname="minSize"]'
    ) as HTMLInputElement;
    const maxSizeElement = element.querySelector(
      '.boardSize [formcontrolname="maxSize"]'
    ) as HTMLInputElement;

    const expectSetValue = (
      inputElement: HTMLInputElement,
      value: number,
      expectSave = true,
      expectConfigUpdate = true,
      expectInvalid = false
    ) => {
      const formControlName = inputElement.getAttribute(
        'formcontrolname'
      ) as string;
      inputElement.value = value + '';
      inputElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      if (expectInvalid) {
        expect(inputElement.getAttribute('aria-invalid')).toBeTruthy();
      }

      if (expectConfigUpdate) {
        const configValue = (
          configurationService.value.getValue().board as any
        )[formControlName];
        expect(configValue).toEqual(value);
      }

      // Allow time for the form group to rebuild after the config change.
      fixture.detectChanges();

      if (expectSave) {
        expect(configurationSaveSpy).toHaveBeenCalled();
      } else {
        expect(configurationSaveSpy).not.toHaveBeenCalled();
      }
      configurationSaveSpy.mockClear();
    };

    expect(minSizeElement.value).toEqual(
      DEFAULT_CONFIGURATION.board.minSize + ''
    );
    expect(maxSizeElement.value).toEqual(
      DEFAULT_CONFIGURATION.board.maxSize + ''
    );

    expectSetValue(minSizeElement, 2);
    expectSetValue(maxSizeElement, 4);

    // Check min/max validation.
    expectSetValue(minSizeElement, -1, false, false, true);
    expectSetValue(minSizeElement, 4, false, false, true);
    expectSetValue(minSizeElement, 5, false, false, true);
    expectSetValue(maxSizeElement, 2, false, false, true);
    expectSetValue(maxSizeElement, 1, false, false, true);
  });

  test('change dice count', () => {
    const addDieElement = getByTitle(element, 'Add Die');
    const removeDieElement = getByTitle(element, 'Remove Die');
    const getDiceInputElements = () =>
      (
        Array.from(
          element.querySelectorAll('mat-form-field.dieField')
        ) as HTMLElement[]
      ).map((fieldElement: HTMLElement) => ({
        faceCountElement: fieldElement.querySelector(
          'input[formControlName="faceCount"]'
        ) as HTMLInputElement,
        selectedFaceElement: fieldElement.querySelector(
          'input[formControlName="selectedFace"]'
        ) as HTMLInputElement,
      }));

    const getDiceValues = () => {
      return getDiceInputElements().map((elMap) => ({
        faceCount: +elMap.faceCountElement.value,
        selectedFace: +elMap.selectedFaceElement.value,
      })) as DieConfiguration[];
    };

    const getConfigurationDiceValues = () =>
      configurationService.value.getValue().dice;

    const addRemoveDie = (shouldAdd: boolean, expectSave = true) => {
      const initialDiceValues = getDiceValues();
      let expectedCount;
      if (shouldAdd) {
        addDieElement.click();
        expectedCount = initialDiceValues.length + 1;
      } else {
        removeDieElement.click();
        expectedCount = (initialDiceValues.length || 1) - 1;
      }

      fixture.detectChanges();
      expect(getDiceValues().length).toEqual(expectedCount);

      if (expectSave) {
        expect(configurationSaveSpy).toHaveBeenCalled();
      } else {
        expect(configurationSaveSpy).not.toHaveBeenCalled();
      }
      configurationSaveSpy.mockClear();
    };

    const setDieFaceCount = (
      index: number,
      faceCount: number,
      expectSave = true,
      expectConfigUpdate = true,
      expectInvalid = false
    ) => {
      const inputElement = getDiceInputElements()[index].faceCountElement;
      inputElement.value = faceCount + '';
      inputElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      if (expectInvalid) {
        expect(inputElement.getAttribute('aria-invalid')).toBeTruthy();
      }

      if (expectConfigUpdate) {
        const configValue =
          configurationService.value.getValue().dice[index].faceCount;
        expect(configValue).toEqual(faceCount);
      }

      // Allow time for the form group to rebuild after the config change.
      fixture.detectChanges();

      if (expectSave) {
        expect(configurationSaveSpy).toHaveBeenCalled();
      } else {
        expect(configurationSaveSpy).not.toHaveBeenCalled();
      }
      configurationSaveSpy.mockClear();
    };

    // Check initial.
    expect(getDiceValues()).toEqual(getConfigurationDiceValues());

    // Add die and set faces.
    addRemoveDie(true);
    expect(getDiceValues().length).toEqual(4);
    expect(getConfigurationDiceValues()).toEqual([
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
    ]);
    setDieFaceCount(0, 2);
    expect(getConfigurationDiceValues()).toEqual([
      { faceCount: 2, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
    ]);
    setDieFaceCount(1, 3);
    expect(getConfigurationDiceValues()).toEqual([
      { faceCount: 2, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 3, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
    ]);
    setDieFaceCount(2, 4);
    expect(getConfigurationDiceValues()).toEqual([
      { faceCount: 2, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 3, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 4, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
    ]);
    setDieFaceCount(3, 5);
    expect(getConfigurationDiceValues()).toEqual([
      { faceCount: 2, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 3, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 4, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 5, selectedFace: DEFAULT_DIE_SELECTED_FACE },
    ]);

    // Remove die
    addRemoveDie(false);
    expect(getDiceValues().length).toEqual(3);
    expect(getConfigurationDiceValues()).toEqual([
      { faceCount: 2, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 3, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 4, selectedFace: DEFAULT_DIE_SELECTED_FACE },
    ]);
    addRemoveDie(false);
    expect(getConfigurationDiceValues()).toEqual([
      { faceCount: 2, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 3, selectedFace: DEFAULT_DIE_SELECTED_FACE },
    ]);
    addRemoveDie(false);
    expect(getConfigurationDiceValues()).toEqual([
      { faceCount: 2, selectedFace: DEFAULT_DIE_SELECTED_FACE },
    ]);
    addRemoveDie(false);
    expect(getConfigurationDiceValues()).toEqual([]);

    // Attempt to remove when there are no more to remove.
    addRemoveDie(false);
    expect(getConfigurationDiceValues()).toEqual([]);

    // Add them all back.
    addRemoveDie(true);
    expect(getConfigurationDiceValues()).toEqual([
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
    ]);
    addRemoveDie(true);
    expect(getConfigurationDiceValues()).toEqual([
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
    ]);
    addRemoveDie(true);
    expect(getConfigurationDiceValues()).toEqual([
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
      { faceCount: 6, selectedFace: DEFAULT_DIE_SELECTED_FACE },
    ]);
  });

  test('Reset to default config', async () => {
    configurationService.update({
      theme: ThemeEnum.LIGHT,
      operations: [],
      board: {
        minSize: 6,
        maxSize: 7,
      },
      dice: [],
    });
    fixture.detectChanges();

    expect(
      (
        element.querySelector(
          '.theme mat-list-option[aria-selected="true"]'
        ) as HTMLElement
      ).getAttribute('ng-reflect-value')
    ).toEqual(ThemeEnum.LIGHT);
    expect(
      element.querySelectorAll(
        '.operations mat-list-option[aria-selected="true"]'
      ).length
    ).toEqual(0);
    expect(
      (
        element.querySelector(
          '.boardSize input[formControlName="minSize"]'
        ) as HTMLInputElement
      ).value
    ).toEqual('6');
    expect(
      (
        element.querySelector(
          '.boardSize input[formControlName="maxSize"]'
        ) as HTMLInputElement
      ).value
    ).toEqual('7');
    expect(
      element.querySelectorAll('.dice input[formControlName="faceCount"]')
        .length
    ).toEqual(0);

    let afterClosedObservable: Observable<boolean> = new Subject<boolean>();
    jest.spyOn(ConfirmDialogComponent, 'open').mockReturnValue({
      afterClosed: () => afterClosedObservable,
    } as any);

    const resetButton = getByText(
      element,
      'Reset all configuration to defaults'
    ) as HTMLButtonElement;

    // Click reset and cancel the dialog.
    afterClosedObservable = new BehaviorSubject(false);
    resetButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(configurationService.value.getValue()).not.toEqual(
      DEFAULT_CONFIGURATION
    );

    // Click reset and accept the dialog.
    afterClosedObservable = new BehaviorSubject(true);
    resetButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(configurationService.value.getValue()).toEqual(
      DEFAULT_CONFIGURATION
    );
  });

  test(ConfigurationComponent.prototype.ngOnDestroy.name, () => {
    expect(component.configurationSubscription?.closed).toBeFalsy();
    const unsubscribeSpy = jest.spyOn(
      component.configurationSubscription as any,
      'unsubscribe'
    );
    fixture.destroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(component.configurationSubscription).toBeFalsy();

    unsubscribeSpy.mockReset();
    component.ngOnDestroy();
    expect(unsubscribeSpy).not.toHaveBeenCalled();
    expect(component.configurationSubscription).toBeFalsy();
  });
});
