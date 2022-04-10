import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { range } from 'lodash';
import { ConfigurationService } from '../configuration.service';
import { Configuration, THEME_CONFIGS, ThemeEnum } from '../general_types';
import { filter, Subscription } from 'rxjs';
import { ToolbarService } from '../toolbar.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { EQUATION_FORMATTER, Operation, OPERATIONS } from '../solver/solver';

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

  private formGroupValueChangeSubscription?: Subscription;

  private configurationSubscription?: Subscription;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly configurationService: ConfigurationService,
    private readonly toolbarService: ToolbarService,
    private readonly router: Router,
    private readonly matDialog: MatDialog
  ) {
    this.toolbarService.set({
      title: 'Configuration',
      buttons: [
        ToolbarService.newButton({
          title: 'Close',
          icon: 'close',
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
    this.formGroupValueChangeSubscription?.unsubscribe();
  }

  resetToDefaults(): void {
    ConfirmDialogComponent.open(this.matDialog, {
      data: {
        content: 'Reset configuration to defaults?',
        acceptButton: {
          show: true,
          title: 'Yes',
          color: 'warn',
        },
        rejectButton: {
          show: true,
          title: 'No',
          type: 'stroked',
        },
      },
    })
      .afterClosed()
      .pipe(filter((value) => value))
      .subscribe(() => {
        this.configurationService.resetToDefaults();
        this.configurationService.save();
      });
  }

  dieFaces(faceCount: number): number[] {
    return range(faceCount).map((value) => value + 1);
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
      const newConfiguration = this.formGroup?.value;
      this.configurationService.update({
        ...newConfiguration,
        theme: newConfiguration.theme[0],
      });
      this.configurationService.save();
    }
  }

  initForm(configuration: Configuration): void {
    this.formGroupValueChangeSubscription?.unsubscribe();

    this.formGroup = this.formBuilder.group({
      theme: this.formBuilder.control([configuration.theme]),
      // theme: configuration.theme,
      operations: this.formBuilder.control(configuration.operations),
      board: this.formBuilder.group({
        minSize: configuration.board.minSize,
        maxSize: configuration.board.maxSize,
      }),
      dice: this.formBuilder.array(
        configuration.dice.map((dieConfiguration) =>
          this.formBuilder.group(dieConfiguration)
        )
      ),
    });

    this.formGroupValueChangeSubscription =
      this.formGroup.valueChanges.subscribe(() => this.onFormChanged());

    this.configuration = configuration;
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

  readonly inputSelectAll = (target?: EventTarget | null) => {
    if (!!target && target instanceof HTMLInputElement) {
      const inputElement = target as HTMLInputElement;
      inputElement.select();
    }
  };
}
