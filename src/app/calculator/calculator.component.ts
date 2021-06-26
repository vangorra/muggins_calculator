import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {
  ALL_OPERATIONS,
  DEFAULT_BOARD_MAX_NUMBER,
  DEFAULT_BOARD_MIN_NUMBER,
  DEFAULT_DICE_COUNT,
  DEFAULT_DIE_SELECTED_FACE,
  DEFAULT_DIE_SELECTED_FACE_COUNT,
  DEFAULT_OPERATIONS,
  DICE_COUNT_OPTIONS,
  Die,
  Operation,
} from "../const";
import {FormControl} from "@angular/forms";
import {Equation} from "../solver/solver";
import {SolverWorkerMessage, SolverWorkerResponse} from "../solver/solver.worker";

interface TypedFormControl<T> extends FormControl {
  readonly value: T;
  setValue(value: T, options?: Object): void;
}

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class CalculatorComponent implements OnInit {
  readonly availableOperations = ALL_OPERATIONS;
  readonly diceCountOptions = DICE_COUNT_OPTIONS;
  readonly selectedOperations: TypedFormControl<Operation[]> = new FormControl(DEFAULT_OPERATIONS);
  readonly selectedDiceCount: TypedFormControl<number> = new FormControl(DEFAULT_DICE_COUNT);
  readonly dice: Die[] = [];
  readonly equationGroups: [string, string[]][] = [];
  private currentWorker: Worker | undefined = undefined;
  isProcessing: boolean = false
  isCancelled: boolean = false;
  selectedEquationString: string | undefined = undefined;

  constructor() { }

  ngOnInit(): void {
    this.updateDice();

    this.selectedOperations.valueChanges.subscribe(() => this.onChange());
    this.selectedDiceCount.valueChanges.subscribe(() => {
      this.updateDice();
      this.onChange();
    });

    this.onChange();
  }

  private updateDice = () => {
    const diceCount = this.selectedDiceCount.value;
    this.dice.splice(diceCount);
    const newDice = [...new Array(diceCount - this.dice.length).keys()].map(() => ({
      selectedFaceCount: DEFAULT_DIE_SELECTED_FACE_COUNT,
      selectedFace: DEFAULT_DIE_SELECTED_FACE,
    }));
    this.dice.push(...newDice);
  }

  selectEquationString(equationString: string): void {
    this.selectedEquationString = equationString;
  }

  equationStringListItemClass(equationString: string) {
    return {
      active: this.selectedEquationString === equationString,
    };
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
      boardMinNumber: DEFAULT_BOARD_MIN_NUMBER,
      boardMaxNumber: DEFAULT_BOARD_MAX_NUMBER,
      selectedDieFaces: this.dice.map(die => die.selectedFace),
      selectedOperators: this.selectedOperations.value.map(o => o.operator)
    } as SolverWorkerMessage);
    this.currentWorker.postMessage(postData);
  }

  onChange(): void {
    this.reload();
  }
}
