import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ConfigurationService } from '../configuration.service';
import { Configuration, THEME_CONFIGS, ThemeEnum } from '../general_types';
import { filter, Subscription, take } from 'rxjs';
import { ToolbarService } from '../toolbar.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
  ButtonTypeEnum,
  ConfirmDialogComponent,
} from '../confirm-dialog/confirm-dialog.component';
import { EQUATION_FORMATTER, Operation, OPERATIONS } from '../solver/solver';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
})
export class ConfigurationComponent implements OnInit, OnDestroy {
  readonly availableThemeConfigs = THEME_CONFIGS;

  readonly availableOperations = OPERATIONS;

  formGroup!: FormGroup;

  configuration!: Configuration;

  configurationSubscription?: Subscription;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly configurationService: ConfigurationService,
    private readonly toolbarService: ToolbarService,
    private readonly router: Router,
    private readonly matDialog: MatDialog,
    private readonly matSnackBar: MatSnackBar
  ) {
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
  }

  ngOnInit(): void {
    this.configurationSubscription = this.configurationService.value.subscribe(
      (configuration) => this.initForm(configuration)
    );
  }

  ngOnDestroy(): void {
    this.configurationSubscription?.unsubscribe();
    this.configurationSubscription = undefined;
  }

  resetToDefaults(): void {
    ConfirmDialogComponent.open(this.matDialog, {
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
      .pipe(
        take(1),
        filter((value) => value)
      )
      .subscribe(() => {
        this.configurationService.resetToDefaults();
        this.configurationService.save();
        this.matSnackBar.open('Configuration reset to defaults.', '', {
          duration: 3000,
        });
      });
  }

  addDie(): void {
    this.configurationService.addDie();
    this.configurationService.save();
  }

  removeDie(): void {
    this.configurationService.removeDie();
    this.configurationService.save();
  }

  onFormChanged(): void {
    if (this.formGroup.valid) {
      const newConfiguration = this.formGroup.value;
      this.configurationService.update({
        ...newConfiguration,
        theme: newConfiguration.theme[0],
      });
      this.configurationService.save();
    }
  }

  initForm(configuration: Configuration): void {
    this.formGroup = this.formBuilder.group({
      theme: this.formBuilder.control([configuration.theme]),
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
              Validators.max(25),
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
    // Avoid recursive calls as the element updates.
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

  getFullExampleEquation(operation: Operation): string {
    const { left, right } = operation.exampleNumbers;
    return EQUATION_FORMATTER(
      operation.solve(left, right),
      operation.display(left, right)
    );
  }

  isThemeChecked(theme: ThemeEnum): boolean {
    return this.configuration.theme === theme;
  }

  inputSelectAll(target?: EventTarget | null): void {
    if (!!target && target instanceof HTMLInputElement) {
      const inputElement = target as HTMLInputElement;
      inputElement.select();
    }
  }
}
