import { Component, OnDestroy, OnInit } from '@angular/core';
import { DEFAULT_DIE_SELECTED_FACE } from '../const';
import {
  Configuration,
  Die,
  SolverWorkerMessage,
  SolverWorkerResponse,
  SolverWorkerResponseDataArray,
  TypedWorker,
} from '../general_types';
import { runSolverWorkerMain } from '../solver/utils';
import { ConfigurationService } from '../configuration.service';
import { Subscription } from 'rxjs';
import { ToolbarService } from '../toolbar.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AboutDialogComponent } from '../about-dialog/about-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss'],
})
export default class CalculatorComponent implements OnInit, OnDestroy {
  readonly dice: Die[] = [];

  readonly workerResponseDataArray: SolverWorkerResponseDataArray = [];

  equationsCount: number = 0;

  private currentWorker:
    | TypedWorker<SolverWorkerMessage, SolverWorkerResponse>
    | undefined = undefined;

  isProcessing: boolean = false;

  isCancelled: boolean = false;

  selectedEquationString: string | undefined = undefined;

  private configurationSubscription?: Subscription;

  solverWorkerResponse?: SolverWorkerResponse;

  scrollToTopVisible = false;

  private readonly onWindowScrolledEventListener = () =>
    this.onWindowScrolled();

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly toolbarService: ToolbarService,
    private readonly router: Router,
    private readonly matDialog: MatDialog,
    private readonly matSnackBar: MatSnackBar
  ) {
    this.toolbarService.set({
      title: 'Muggins Calculator',
      buttons: [
        ToolbarService.newButton({
          title: 'About',
          icon: 'help',
          onClick: () => this.matDialog.open(AboutDialogComponent, {}),
        }),
        ToolbarService.newButton({
          title: 'Configuration',
          icon: 'settings',
          onClick: () => this.router.navigate(['/configuration']),
        }),
      ],
    });
  }

  ngOnInit(): void {
    this.configurationSubscription = this.configurationService.value.subscribe(
      (configuration) => this.onConfigurationUpdated(configuration)
    );

    window.addEventListener('scroll', this.onWindowScrolledEventListener, true);
  }

  ngOnDestroy(): void {
    this.configurationSubscription?.unsubscribe();

    window.removeEventListener(
      'scroll',
      this.onWindowScrolledEventListener,
      true
    );
  }

  onWindowScrolled(): void {
    const element = document.getElementById('diceOptions');
    if (element && window.scrollY > element.offsetHeight + element.offsetTop) {
      this.scrollToTopVisible = true;
    } else {
      this.scrollToTopVisible = false;
    }
  }

  onConfigurationUpdated(configuration: Configuration): void {
    this.dice.splice(0, configuration.dice.length);
    const newDice = configuration.dice.map((die) => ({
      faceCount: die.faceCount,
      selectedFace: DEFAULT_DIE_SELECTED_FACE,
    }));
    this.dice.push(...newDice);

    this.reload();
  }

  selectEquationString(equationString: string): void {
    this.selectedEquationString = this.isEquationStringSelected(equationString)
      ? undefined
      : equationString;
  }

  equationStringListItemClass(equationString: string) {
    return {
      active: this.isEquationStringSelected(equationString),
    };
  }

  isEquationStringSelected(equationString: string): boolean {
    return this.selectedEquationString === equationString;
  }

  cancel(): void {
    this.currentWorker?.terminate();
    this.emptyEquationGroups();
    this.isProcessing = false;
    this.isCancelled = true;
  }

  reload() {
    this.cancel();
    this.isProcessing = true;
    this.isCancelled = false;

    const configuration = this.configurationService.value.getValue();
    const message: SolverWorkerMessage = {
      boardMinNumber: configuration.board.minSize,
      boardMaxNumber: configuration.board.maxSize,
      diceFaces: this.dice.map((die) => die.selectedFace),
      operators: Object.entries(configuration.operations)
        .filter((entry) => entry[1])
        .map((entry) => entry[0]),
    };

    // Run process in a worker.
    if (Worker) {
      this.currentWorker = new Worker(
        new URL('../solver.worker', import.meta.url)
      );
      this.currentWorker.onmessage = (response) =>
        this.onWorkerResponse(response.data);
      this.currentWorker.postMessage(message);
    } else {
      // Run process in current thread.
      this.onWorkerResponse(runSolverWorkerMain(message));
    }
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
    this.isProcessing = false;
  }

  onDieChanged(dieIndex: number, die: Die): void {
    this.dice[dieIndex] = die;
    this.reload();
  }

  groupId(group: string): string {
    return `group_${group}`;
  }

  scrollToId(groupId: string, group: string): void {
    this.matSnackBar.dismiss();
    document
      .getElementById(groupId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    this.matSnackBar.open(`Jumped to group ${group}.`, '', {
      duration: 2000,
    });
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
}
