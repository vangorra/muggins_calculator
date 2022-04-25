import { Component, OnDestroy, OnInit } from '@angular/core';
import { Configuration, Die } from '../general_types';
import {
  SolverWorkerMessage,
  SolverWorkerResponse,
  SolverWorkerResponseDataArray,
} from '../solver/utils';
import { ConfigurationService } from '../configuration.service';
import { Subscription, take } from 'rxjs';
import { ToolbarService } from '../toolbar.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AboutDialogComponent } from '../about-dialog/about-dialog.component';
import { SolverWorkerService } from '../solver-worker.service';

enum CalculateState {
  PROCESSING = 'processing',
  PROCESSED = 'processed',
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

  readonly workerResponseDataArray: SolverWorkerResponseDataArray = [];

  equationsCount: number = 0;

  configurationSubscription?: Subscription;

  solverWorkerResponse?: SolverWorkerResponse;

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly toolbarService: ToolbarService,
    private readonly router: Router,
    readonly matDialog: MatDialog,
    private readonly solverWorkerService: SolverWorkerService
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

  emptyEquationGroups() {
    this.workerResponseDataArray.splice(0, this.workerResponseDataArray.length);
    this.equationsCount = 0;
  }

  onWorkerResponse(response: SolverWorkerResponse): void {
    this.emptyEquationGroups();

    // Add the new groups.
    this.workerResponseDataArray.push(...response.data);
    this.equationsCount = this.workerResponseDataArray
      .map((data) => data.results.length)
      .reduce((partialSum, a) => partialSum + a, 0);
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

  groupId(group: string): string {
    return `group_${group}`;
  }

  scrollToId(groupId: string): void {
    document
      .getElementById(groupId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
