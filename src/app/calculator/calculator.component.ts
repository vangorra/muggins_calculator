import { Component, OnDestroy, OnInit } from '@angular/core';
import { Configuration, Die } from '../general_types';
import { ConfigurationService } from '../configuration.service';
import { Subscription } from 'rxjs';
import { ToolbarService } from '../toolbar.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AboutDialogComponent } from '../about-dialog/about-dialog.component';
import { Datasource } from 'ngx-ui-scroll';
import { SizeStrategy } from 'vscroll';
import { uniqBy } from 'lodash';
import { MugginsSolverOrchestrator } from '../solver/solver';
import { CalculateEquationResult } from '../solver/solver-common';
import { ProgressStatus, PooledExecutor } from '../solver/worker-utils';

export enum CalculateState {
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  CANCELLED = 'cancelled',
}

interface Solution {
  readonly total: number;
  /**
   * Determines if this is the first result of a new total. This is used to show a divider between groups of results.
   */
  readonly firstResultIndex: number;
}

interface CalculateEquationResultWithId extends CalculateEquationResult {
  readonly index: number;
  readonly isFirstSolution: boolean;
}

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss'],
})
export default class CalculatorComponent implements OnInit, OnDestroy {
  readonly calculateStates = CalculateState;

  calculateState = CalculateState.PROCESSED;

  readonly dice: Die[] = [];

  readonly solutions: Solution[] = [];

  readonly calculateResultArray: CalculateEquationResultWithId[] = [];

  configurationSubscription?: Subscription;

  calculateHandler?: PooledExecutor.WorkHandler<
    CalculateEquationResult[],
    ProgressStatus
  >;

  calculateProgress = 0;

  calculateProgressBuffer = 0;

  readonly calculateResultArrayDataSource =
    new Datasource<CalculateEquationResultWithId>({
      get: (index, count, success) => {
        success(this.calculateResultArray.slice(index, index + count));
      },
      settings: {
        minIndex: 0,
        startIndex: 0,
        bufferSize: 15,
        sizeStrategy: SizeStrategy.Constant,
        windowViewport: true,
      },
    });

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly toolbarService: ToolbarService,
    private readonly router: Router,
    readonly matDialog: MatDialog,
    private readonly mugginsSolverOrchestrator: MugginsSolverOrchestrator
  ) {
    this.toolbarService.set({
      title: 'Muggins Calculator',
      buttons: [
        ToolbarService.newButton({
          title: 'About',
          icon: 'help',
          testId: 'app-calculator_toolbar_aboutButton',
          onClick: () => this.matDialog.open(AboutDialogComponent, {}),
        }),
        ToolbarService.newButton({
          title: 'Configuration',
          icon: 'settings',
          testId: 'app-calculator_toolbar_configurationButton',
          onClick: () => this.router.navigate(['/configuration']),
        }),
      ],
    });
  }

  ngOnInit(): void {
    this.configurationSubscription = this.configurationService.value.subscribe(
      (configuration) => this.onConfigurationUpdated(configuration)
    );
  }

  ngOnDestroy(): void {
    this.cancel();
    this.configurationSubscription?.unsubscribe();
    this.configurationSubscription = undefined;
  }

  onConfigurationUpdated(configuration: Configuration): void {
    // Set the dice from configuration.
    this.dice.splice(0, configuration.dice.length);
    const newDice = configuration.dice.map(({ faceCount, selectedFace }) => ({
      faceCount,
      selectedFace,
    }));
    this.dice.push(...newDice);

    this.reload();
  }

  async reload() {
    await this.cancel();
    this.calculateState = CalculateState.PROCESSING;

    const configuration = this.configurationService.value.getValue();
    const { operations } = configuration;

    // Start the calculations.
    this.calculateHandler = this.mugginsSolverOrchestrator.calculate({
      minTotal: configuration.board.minSize,
      maxTotal: configuration.board.maxSize,
      faces: this.dice.map(({ selectedFace }) => selectedFace),
      operations: operations as any,
    });

    this.calculateProgress = 0;
    this.calculateProgressBuffer = 0;
    this.calculateHandler?.status.subscribe(({ total, current, buffer }) => {
      this.calculateProgress = Math.floor((current / total) * 100);
      this.calculateProgressBuffer = Math.floor((buffer / total) * 100);
    });

    let data: CalculateEquationResult[];
    try {
      data = await this.calculateHandler.data;
    } catch (e) {
      this.calculateState = CalculateState.CANCELLED;
      return;
    }

    // Empty and add the new results.
    let currentSolution: number | undefined = undefined;
    const newResults = data.map((result, index) => {
      const solution = result.total;
      const isFirstSolution = solution != currentSolution;
      currentSolution = solution;
      return {
        ...result,
        index,
        isFirstSolution,
      };
    });
    this.calculateResultArray.splice(0, this.calculateResultArray.length);
    newResults.forEach((newResult) =>
      this.calculateResultArray.push(newResult)
    );

    // Empty and add the solution totals.
    const newSolutions = uniqBy(this.calculateResultArray, 'total').map(
      ({ total, index }) =>
        ({
          total,
          firstResultIndex: index,
        } as Solution)
    );
    this.solutions.splice(0, this.solutions.length);
    newSolutions.forEach((newSolution) => this.solutions.push(newSolution));

    // Update the list adapter.
    const { adapter } = this.calculateResultArrayDataSource;
    await adapter.relax();
    await adapter.replace({
      items: this.calculateResultArray,
      predicate: () => true,
    });
    this.calculateState = CalculateState.PROCESSED;
    this.calculateHandler?.status.unsubscribe();
  }

  async cancel() {
    this.calculateHandler?.stop();
    this.calculateHandler?.status.unsubscribe();
    this.calculateState = CalculateState.CANCELLED;
  }

  onDiceFaceChanged(dice: Die[]): void {
    dice.forEach((die, index) => (this.dice[index] = die));

    // Save the selected faces to the configuration.
    this.configurationService.update({
      dice: dice.map(({ faceCount, selectedFace }) => ({
        faceCount,
        selectedFace,
      })),
    });
    this.configurationService.save();
  }

  async jumpToResultIndex(targetIndex: number): Promise<void> {
    const { adapter } = this.calculateResultArrayDataSource;

    // Tell the adapter to start from this item.
    await adapter.relax();
    await adapter.reload(targetIndex);

    // Ensure the item is not hidden by the toolbar.
    const scrollToIndex = targetIndex - 2 >= 0 ? targetIndex - 2 : 0;
    await adapter.relax();
    await adapter.fix({
      scrollToItem: ({ data }) => data.index === scrollToIndex,
    });
  }

  readonly reloadResultsToStart = async () => {
    const { adapter } = this.calculateResultArrayDataSource;
    await adapter.relax();
    await adapter.fix({
      scrollPosition: 0,
    });
  };
}
