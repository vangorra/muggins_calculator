import { Component, OnDestroy, OnInit } from '@angular/core';
import { Configuration, Die } from '../general_types';
import { SolverWorkerMessage, SolverWorkerResponse } from '../solver/utils';
import { ConfigurationService } from '../configuration.service';
import { Subscription, take } from 'rxjs';
import { ToolbarService } from '../toolbar.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AboutDialogComponent } from '../about-dialog/about-dialog.component';
import { SolverWorkerService } from '../solver-worker.service';
import { Datasource } from 'ngx-ui-scroll';
import { CalculateResult } from '../solver/solver';
import { SizeStrategy } from 'vscroll';
import { uniqBy } from 'lodash';

export enum CalculateState {
  PROCESSING = 'processing',
  PROCESSED = 'processed',
}

interface Solution {
  readonly total: number;
  /**
   * Determines if this is the first result of a new total. This is used to show a divider between groups of results.
   */
  readonly firstResultIndex: number;
}

interface CalculateResultWithId extends CalculateResult {
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

  readonly calculateResultArray: CalculateResultWithId[] = [];

  configurationSubscription?: Subscription;

  solverWorkerResponse?: SolverWorkerResponse;

  readonly calculateResultArrayDataSource =
    new Datasource<CalculateResultWithId>({
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
    readonly solverWorkerService: SolverWorkerService
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

  toggleWasm() {
    this.solverWorkerService.useWasm = !this.solverWorkerService.useWasm;
  }

  ngOnInit(): void {
    this.configurationSubscription = this.configurationService.value.subscribe(
      (configuration) => this.onConfigurationUpdated(configuration)
    );
  }

  ngOnDestroy(): void {
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

  reload() {
    this.calculateState = CalculateState.PROCESSING;

    const configuration = this.configurationService.value.getValue();
    const { operations } = configuration;
    const message: SolverWorkerMessage = {
      operations,
      minTotal: configuration.board.minSize,
      maxTotal: configuration.board.maxSize,
      faces: this.dice.map(({ selectedFace }) => selectedFace),
    };

    this.solverWorkerService
      .postMessage(message)
      .pipe(take(1))
      .subscribe((response) => this.onWorkerResponse(response));
  }

  async onWorkerResponse(response: SolverWorkerResponse): Promise<void> {
    // Empty and add the new results.
    let currentSolution: number | undefined = undefined;
    const newResults = response.data.map((result, index) => {
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
    this.calculateResultArray.push(...newResults);

    // Empty and add the solutions.
    const newSolutions = uniqBy(this.calculateResultArray, 'total').map(
      ({ total, index }) =>
        ({
          total,
          firstResultIndex: index,
        } as Solution)
    );
    this.solutions.splice(0, this.solutions.length);
    this.solutions.push(...newSolutions);

    const { adapter } = this.calculateResultArrayDataSource;
    await adapter.relax();
    await adapter.replace({
      items: this.calculateResultArray,
      predicate: () => true,
    });
    this.calculateState = CalculateState.PROCESSED;
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

    this.reload();
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
