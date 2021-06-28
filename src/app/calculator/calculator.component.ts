import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatBottomSheet} from "@angular/material/bottom-sheet";
import {merge, Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {DEFAULT_CONFIG, DEFAULT_DIE_SELECTED_FACE, DEFAULT_DIE_SELECTED_FACE_COUNT} from "../const";
import {Config, Die, SolverWorkerMessage, SolverWorkerResponse, TypedWorker} from "../general_types";
import ConfigComponent from "../config/config.component";

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.less'],
})
export default class CalculatorComponent implements OnInit, OnDestroy {
  readonly dice: Die[] = [];

  readonly equationGroups: [string, string[]][] = [];

  private currentWorker: TypedWorker<SolverWorkerMessage, SolverWorkerResponse> | undefined = undefined;

  isProcessing: boolean = false

  isCancelled: boolean = false;

  selectedEquationString: string | undefined = undefined;

  readonly config: Config = ({ ...DEFAULT_CONFIG});

  private readonly bottomSheet: MatBottomSheet;

  private readonly destroyBottomSheet = new Subject<void>();

  constructor(bottomSheet: MatBottomSheet) {
    this.bottomSheet = bottomSheet;
  }

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy() {
    this.destroyBottomSheet.next();
  }

  openConfig(): void {
    const self = this;
    const configComponentRef = this.bottomSheet.open(ConfigComponent);

    // Unsubscribe the old form controls.
    this.destroyBottomSheet.next();

    const configInstance = configComponentRef.instance;
    configInstance.boardMinNumber.setValue(this.config.boardMinNumber);
    configInstance.boardMaxNumber.setValue(this.config.boardMaxNumber);
    configInstance.diceCount.setValue(this.config.diceCount);
    configInstance.customizeDieFaceCount.setValue(this.config.customizeDieFaceCount);
    configInstance.operations.setValue(this.config.operations);

    // Subscribe to changes in the new form controls.
    merge(
      configInstance.boardMinNumber.valueChanges,
      configInstance.boardMaxNumber.valueChanges,
      configInstance.diceCount.valueChanges,
      configInstance.customizeDieFaceCount.valueChanges,
      configInstance.operations.valueChanges
    )
    .pipe(takeUntil(this.destroyBottomSheet))
    .subscribe(() => {
      Object.assign(self.config, {
        boardMinNumber: configInstance.boardMinNumber.value,
        boardMaxNumber: configInstance.boardMaxNumber.value,
        diceCount: configInstance.diceCount.value,
        operations: configInstance.operations.value,
        customizeDieFaceCount: configInstance.customizeDieFaceCount.value,
      });
      self.reload();
    });
  }

  selectEquationString(equationString: string): void {
    this.selectedEquationString = this.isEquationStringSelected(equationString) ? undefined : equationString;
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
    this.equationGroups.splice(0, this.equationGroups.length);
    this.isProcessing = false;
    this.isCancelled = true;
  }

  reload(): void {
    this.isCancelled = false;
    this.isProcessing = true;
    this.currentWorker?.terminate();

    // Update the dice.
    const {diceCount} = this.config;
    this.dice.splice(diceCount);
    const newDice = [...new Array(diceCount - this.dice.length).keys()].map(() => ({
      selectedFaceCount: DEFAULT_DIE_SELECTED_FACE_COUNT,
      selectedFace: DEFAULT_DIE_SELECTED_FACE,
    }));
    this.dice.push(...newDice);

    // Setup the worker.
    this.currentWorker = new Worker(new URL('../solver/solver.worker', import.meta.url));
    this.currentWorker.onmessage = response => {
      const { data } = response;

      // Empty the current array.
      this.equationGroups.splice(0, this.equationGroups.length);

      // Add the new groups.
      this.equationGroups.push(...Object.entries(data));
      this.isProcessing = false;
    };

    this.currentWorker.postMessage({
      boardMinNumber: this.config.boardMinNumber,
      boardMaxNumber: this.config.boardMaxNumber,
      selectedDieFaces: this.dice.map(die => die.selectedFace),
      selectedOperators: this.config.operations.map(o => o.operator)
    });
  }

  onChange(): void {
    this.reload();
  }
}
