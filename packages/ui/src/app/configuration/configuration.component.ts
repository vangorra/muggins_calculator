import {
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  OnDestroy,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ConfigurationService } from '../configuration.service';
import {
  CALCULATION_MODE_CONFIGS,
  Configuration,
  THEME_CONFIGS,
} from '../general_types';
import { firstValueFrom, take } from 'rxjs';
import { ToolbarService } from '../toolbar.service';
import { Router } from '@angular/router';
import {
  ButtonTypeEnum,
  ConfirmDialogComponent,
} from '../confirm-dialog/confirm-dialog.component';
import {
  EQUATION_FORMATTER,
  Operation,
  OPERATIONS_LIST,
  MAX_FACE_VALUE,
} from '@muggins_calculator/common';
import { MatRadioChange } from '@angular/material/radio';
import { MINIMUM_PERFORMANT_DIE_COUNT } from '../const';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarRef,
  TextOnlySnackBar,
} from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MathJaxDirective } from '../math-jax/math-jax.directive';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
  imports: [
    MatIconModule,
    MatCardModule,
    ReactiveFormsModule,
    MatInputModule,
    MatRadioModule,
    MatListModule,
    MatButtonModule,
    MathJaxDirective,
  ],
})
export class ConfigurationComponent implements OnDestroy {
  readonly availableThemeConfigs = THEME_CONFIGS;
  readonly availableCalculationModeConfigs = CALCULATION_MODE_CONFIGS;
  readonly availableOperations = OPERATIONS_LIST;

  formGroup!: FormGroup;
  configuration!: Configuration;

  private readonly dialog = inject(MatDialog);
  private readonly matSnackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);
  private readonly configurationService = inject(ConfigurationService);
  private readonly toolbarService = inject(ToolbarService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private addDieSnackbarWarning?: MatSnackBarRef<TextOnlySnackBar>;

  constructor() {
    this.toolbarService.set({
      title: 'Configuration',
      buttons: [
        ToolbarService.newButton({
          title: 'Close',
          icon: 'close',
          testId: 'app-configuration_toolbar_closeButton',
          onClick: () => this.router.navigate(['/calculator']),
        }),
      ],
    });

    effect(() => {
      this.initForm(this.configurationService.value());
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.matSnackBar.dismiss();
  }

  async resetToDefaults(): Promise<void> {
    const result = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            content: 'Reset configuration to defaults?',
            acceptButton: {
              show: true,
              title: 'Yes',
            },
            rejectButton: {
              show: true,
              title: 'No',
              type: ButtonTypeEnum.stroked,
            },
          },
        })
        .afterClosed()
    );
    if (result) {
      this.configurationService.resetToDefaults();
      this.configurationService.save();
      this.matSnackBar.open('Configuration reset to defaults.', '', {
        duration: 3000,
      });
    }
  }

  addDie(): void {
    this.configurationService.addDie();
    this.configurationService.save();

    const dieCount = this.configurationService.value().dice.length;
    if (
      dieCount > MINIMUM_PERFORMANT_DIE_COUNT &&
      !this.addDieSnackbarWarning
    ) {
      this.addDieSnackbarWarning = this.matSnackBar.open(
        `Warning: More than ${MINIMUM_PERFORMANT_DIE_COUNT} dice will result is VERY slow runs.`,
        'Dismiss',
        { duration: 5000 }
      );
      firstValueFrom(this.addDieSnackbarWarning.afterDismissed()).then(
        () => (this.addDieSnackbarWarning = undefined)
      );
    }
  }

  removeDie(): void {
    this.configurationService.removeDie();
    this.configurationService.save();

    const dieCount = this.configurationService.value().dice.length;
    if (
      dieCount <= MINIMUM_PERFORMANT_DIE_COUNT &&
      this.addDieSnackbarWarning
    ) {
      this.addDieSnackbarWarning.dismissWithAction();
    }
  }

  onFormChanged(): void {
    if (this.formGroup.valid) {
      const newConfiguration = this.formGroup.value;
      this.configurationService.update(newConfiguration);
      this.configurationService.save();
    }
  }

  initForm(configuration: Configuration): void {
    this.formGroup = this.formBuilder.group({
      operations: this.formBuilder.control(configuration.operations),
      board: this.formBuilder.group({
        minSize: this.formBuilder.control(configuration.board.minSize, [
          Validators.min(1),
          Validators.max(configuration.board.maxSize - 1),
          Validators.required,
        ]),
        maxSize: this.formBuilder.control(configuration.board.maxSize, [
          Validators.min(configuration.board.minSize + 1),
          Validators.required,
        ]),
      }),
      dice: this.formBuilder.array(
        configuration.dice.map((dieConfiguration) =>
          this.formBuilder.group({
            faceCount: this.formBuilder.control(dieConfiguration.faceCount, [
              Validators.min(1),
              Validators.max(MAX_FACE_VALUE),
              Validators.required,
            ]),
            selectedFace: this.formBuilder.control(
              dieConfiguration.selectedFace
            ),
          })
        )
      ),
    });

    this.formGroup.valueChanges
      .pipe(take(1))
      .subscribe(() => this.onFormChanged());

    this.configuration = configuration;
  }

  trackDieByIndex(index: any) {
    return index;
  }

  private isSettingDieFaceCount = false;

  setDieFaceCount(dieIndex: number, event: Event) {
    if (this.isSettingDieFaceCount) {
      return;
    }
    this.isSettingDieFaceCount = true;
    const control = this.formGroup.get([
      'dice',
      dieIndex,
      'faceCount',
    ]) as FormControl;
    control.setValue(event);
    this.onFormChanged();
    this.isSettingDieFaceCount = false;
  }

  onThemeChange(event: MatRadioChange): void {
    this.configurationService.update({ theme: event.value });
    this.configurationService.save();
  }

  onCalculationModeChange(event: MatRadioChange): void {
    this.configurationService.update({ calculationMode: event.value });
    this.configurationService.save();
  }

  getFullExampleEquation(operation: Operation): string {
    const { left, right } = operation.exampleNumbers;
    return EQUATION_FORMATTER(
      operation.solve(left, right),
      operation.display(left, right)
    );
  }

  inputSelectAll(target?: EventTarget | null): void {
    if (target && target instanceof HTMLInputElement) {
      (target as HTMLInputElement).select();
    }
  }
}
