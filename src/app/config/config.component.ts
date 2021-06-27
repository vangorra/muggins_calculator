import {Component} from '@angular/core';
import {FormControl} from "@angular/forms";
import {
  ALL_OPERATIONS,
  DEFAULT_BOARD_MAX_NUMBER,
  DEFAULT_BOARD_MIN_NUMBER,
  DEFAULT_DICE_COUNT,
  DEFAULT_OPERATIONS,
  DICE_COUNT_OPTIONS
} from "../const";
import {TypedFormControl} from "../dom_types";
import {Operation} from "../general_types";

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.less']
})
export default class ConfigComponent {
  readonly availableOperations = ALL_OPERATIONS;

  readonly diceCountOptions = DICE_COUNT_OPTIONS;

  readonly boardMinNumber: TypedFormControl<number> = new FormControl(DEFAULT_BOARD_MIN_NUMBER);

  readonly boardMaxNumber: TypedFormControl<number> = new FormControl(DEFAULT_BOARD_MAX_NUMBER);

  readonly diceCount: TypedFormControl<number> = new FormControl(DEFAULT_DICE_COUNT);

  readonly operations: TypedFormControl<Operation[]> = new FormControl(DEFAULT_OPERATIONS);
}
