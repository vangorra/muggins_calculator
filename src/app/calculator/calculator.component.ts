import {Component, OnInit} from '@angular/core';
import {DEFAULT_CONFIG, DEFAULT_DIE_SELECTED_FACE, DEFAULT_DIE_SELECTED_FACE_COUNT} from "../const";
import {SolverWorkerMessage, SolverWorkerResponse} from "../solver/solver.worker";
import {Config, Die} from "../general_types";
import {MatBottomSheet} from "@angular/material/bottom-sheet";
import {ConfigComponent} from "../config/config.component";
import {merge} from "rxjs";

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.less'],
})
export class CalculatorComponent implements OnInit {
  readonly dice: Die[] = [];
  readonly equationGroups: [string, string[]][] = [];
  private currentWorker: Worker | undefined = undefined;
  isProcessing: boolean = false
  isCancelled: boolean = false;
  selectedEquationString: string | undefined = undefined;
  readonly config: Config = DEFAULT_CONFIG;
  private readonly bottomSheet: MatBottomSheet;

  constructor(bottomSheet: MatBottomSheet) {
    this.bottomSheet = bottomSheet;
  }

  ngOnInit(): void {
    this.reload();
  }

  openConfig(): void {
    const self = this;
    const configComponentRef = this.bottomSheet.open(ConfigComponent);

    const configInstance = configComponentRef.instance;
    configInstance.boardMinNumber.setValue(this.config.boardMinNumber);
    configInstance.boardMaxNumber.setValue(this.config.boardMaxNumber);
    configInstance.diceCount.setValue(this.config.diceCount);
    configInstance.operations.setValue(this.config.operations);

    merge(
      configInstance.boardMinNumber.valueChanges,
      configInstance.boardMaxNumber.valueChanges,
      configInstance.diceCount.valueChanges,
      configInstance.operations.valueChanges
    ).subscribe(() => {
      Object.assign(self.config, {
        boardMinNumber: configInstance.boardMinNumber.value,
        boardMaxNumber: configInstance.boardMaxNumber.value,
        diceCount: configInstance.diceCount.value,
        operations: configInstance.operations.value,
      });
      self.reload();
    })
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
    const diceCount = this.config.diceCount;
    this.dice.splice(diceCount);
    const newDice = [...new Array(diceCount - this.dice.length).keys()].map(() => ({
      selectedFaceCount: DEFAULT_DIE_SELECTED_FACE_COUNT,
      selectedFace: DEFAULT_DIE_SELECTED_FACE,
    }));
    this.dice.push(...newDice);


    this.currentWorker = new Worker(new URL('../solver/solver.worker', import.meta.url));
    this.currentWorker.onmessage = response => {
      const data: SolverWorkerResponse = JSON.parse(response.data);

      // Empty the current array.
      this.equationGroups.splice(0, this.equationGroups.length);

      // Add the new groups.
      this.equationGroups.push(...Object.entries(data));
      this.isProcessing = false;
    };

    const postData = JSON.stringify({
      boardMinNumber: this.config.boardMinNumber,
      boardMaxNumber: this.config.boardMaxNumber,
      selectedDieFaces: this.dice.map(die => die.selectedFace),
      selectedOperators: this.config.operations.map(o => o.operator)
    } as SolverWorkerMessage);
    this.currentWorker.postMessage(postData);
  }

  onChange(): void {
    this.reload();
  }
}
