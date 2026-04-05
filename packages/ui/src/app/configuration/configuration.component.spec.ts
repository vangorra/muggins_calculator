import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationComponent } from './configuration.component';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ConfigurationService } from '../configuration.service';
import { CalculationModeEnum, DieConfiguration, ThemeEnum } from '../general_types';
import { OperationEnum } from '@muggins_calculator/common';
import { DEFAULT_CONFIGURATION, DEFAULT_DIE_SELECTED_FACE } from '../const';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { MathJaxState } from '../math-jax/math-jax.service';
import { mockMathJaxProvider } from '../test-utils';
import { MatDialog } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';

describe(ConfigurationComponent.name, () => {
  let component: ConfigurationComponent;
  let fixture: ComponentFixture<ConfigurationComponent>;
  let element: HTMLElement;
  let configurationService: ConfigurationService;
  let configurationSaveSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationComponent],
      providers: [
        provideRouter([]),
        provideAnimations(),
        mockMathJaxProvider(MathJaxState.initialized),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    configurationService = TestBed.inject(ConfigurationService);
    configurationService.resetToDefaults();
    configurationService.save();
    configurationSaveSpy = vi.spyOn(configurationService, 'save');

    fixture = TestBed.createComponent(ConfigurationComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    fixture.detectChanges();
  });

  it('change theme', () => {
    const getOptionWithText = (text: string) => {
      const radioButton = Array.from(
        element.querySelectorAll('.theme mat-radio-button')
      ).find(
        (el) => (el as HTMLElement).textContent?.trim() === text
      ) as HTMLElement;
      // Click the inner input for proper event propagation in jsdom.
      return (radioButton?.querySelector('.mdc-radio__native-control') ??
        radioButton) as HTMLElement;
    };

    const expectSelectedTheme = (
      theme: ThemeEnum,
      text: string,
      expectSave = true
    ) => {
      const selectedRadioOptions = element.querySelectorAll(
        '.theme mat-radio-button.mat-mdc-radio-checked'
      ) as NodeListOf<HTMLElement>;

      expect(selectedRadioOptions.length).toEqual(1);

      const selectedRadioOption = selectedRadioOptions[0];

      expect(configurationService.value().theme).toEqual(theme);
      expect(selectedRadioOption.textContent?.trim()).toEqual(text);

      if (expectSave) {
        expect(configurationSaveSpy).toHaveBeenCalled();
      } else {
        expect(configurationSaveSpy).not.toHaveBeenCalled();
      }
      configurationSaveSpy.mockClear();
    };

    // Check initial.
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

  it('change operations', () => {
    const getOptionWithText = (text: string) =>
      Array.from(element.querySelectorAll('.operations mat-list-option')).find(
        (el) => el.querySelector('[matlistitemtitle]')?.textContent?.trim() === text
      ) as HTMLElement;

    const expectSelectedOperations = (
      operations: OperationEnum[],
      expectSave = true
    ) => {
      const selectedOperations = Array.from(
        element.querySelectorAll(
          '.operations mat-list-option[aria-selected="true"]'
        )
      ).map((el) => el.getAttribute('data-value'));

      expect(selectedOperations).toEqual(operations);
      expect(configurationService.value().operations).toEqual(
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

      const value = option.getAttribute('data-value') as OperationEnum;
      expect(value).toBeTruthy();

      const isOnInConfig = () =>
        configurationService.value().operations.indexOf(value) > -1;
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

  it('change board size', () => {
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
          configurationService.value().board as any
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

  it('change dice count', () => {
    const addDieElement = element.querySelector('[title="Add Die"]') as HTMLElement;
    const removeDieElement = element.querySelector('[title="Remove Die"]') as HTMLElement;
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
      configurationService.value().dice;

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
          configurationService.value().dice[index].faceCount;
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

  it('Reset to default config', async () => {
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
          '.theme mat-radio-button.mat-mdc-radio-checked'
        ) as HTMLElement
      ).getAttribute('data-value')
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
    const dialog = TestBed.inject(MatDialog);
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => afterClosedObservable,
    } as any);

    const resetButton = Array.from(element.querySelectorAll('button')).find(
      (el) => el.textContent?.trim() === 'Reset all configuration to defaults'
    ) as HTMLButtonElement;

    // Click reset and cancel the dialog.
    afterClosedObservable = new BehaviorSubject(false);
    resetButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(configurationService.value()).not.toEqual(
      DEFAULT_CONFIGURATION
    );

    // Click reset and accept the dialog.
    afterClosedObservable = new BehaviorSubject(true);
    resetButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(configurationService.value()).toEqual(
      DEFAULT_CONFIGURATION
    );
  });

  it('ngOnDestroy dismisses snackbar', () => {
    // The component ngOnDestroy dismisses the snack bar.
    // Just verify it doesn't throw.
    fixture.destroy();
  });

  it('addDie triggers snackbar warning when die count exceeds MINIMUM_PERFORMANT_DIE_COUNT', async () => {
    const matSnackBar = TestBed.inject(
      (await import('@angular/material/snack-bar')).MatSnackBar
    );
    const snackBarSpy = vi.spyOn(matSnackBar, 'open');

    // Start with 3 dice (default). Add dice until we exceed MINIMUM_PERFORMANT_DIE_COUNT (4).
    // Adding 1 die -> 4 dice (equal, no warning)
    component.addDie();
    fixture.detectChanges();
    expect(snackBarSpy).not.toHaveBeenCalled();

    // Adding 1 more die -> 5 dice (exceeds 4, warning should appear)
    component.addDie();
    fixture.detectChanges();
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Warning: More than 4 dice will result is VERY slow runs.',
      'Dismiss',
      { duration: 5000 }
    );

    // Adding another die should NOT show a second warning (snackbar ref still active)
    snackBarSpy.mockClear();
    component.addDie();
    fixture.detectChanges();
    expect(snackBarSpy).not.toHaveBeenCalled();

    // Remove dice until we're at 5 (threshold + 1), then remove one more to trigger dismiss
    // Currently at 6 dice (3 default + 3 added). Remove until at 5.
    component.removeDie();
    fixture.detectChanges();

    // Now at 5 dice. Set up the snackbar ref mock for the dismiss path.
    const dismissWithActionSpy = vi.fn();
    (component as any).addDieSnackbarWarning = { dismissWithAction: dismissWithActionSpy, afterDismissed: () => new BehaviorSubject({}) };

    // Remove one more -> 4 dice, which is <= MINIMUM_PERFORMANT_DIE_COUNT (4)
    component.removeDie();
    fixture.detectChanges();
    expect(dismissWithActionSpy).toHaveBeenCalled();
  });

  it('onCalculationModeChange updates configuration', () => {
    component.onCalculationModeChange({
      value: CalculationModeEnum.LOCAL_ONLY,
    } as MatRadioChange);
    fixture.detectChanges();

    expect(configurationService.value().calculationMode).toEqual(
      CalculationModeEnum.LOCAL_ONLY
    );
    expect(configurationSaveSpy).toHaveBeenCalled();
  });

  it('inputSelectAll calls select on HTMLInputElement', () => {
    const input = document.createElement('input');
    const selectSpy = vi.spyOn(input, 'select');

    component.inputSelectAll(input);
    expect(selectSpy).toHaveBeenCalled();
  });

  it('inputSelectAll does nothing for non-HTMLInputElement', () => {
    const div = document.createElement('div');
    // Should not throw
    component.inputSelectAll(div);
  });

  it('inputSelectAll does nothing for null/undefined', () => {
    component.inputSelectAll(null);
    component.inputSelectAll(undefined);
  });
});
