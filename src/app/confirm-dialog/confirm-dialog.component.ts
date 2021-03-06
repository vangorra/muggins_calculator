import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDialogConfig } from '@angular/material/dialog/dialog-config';
import { ObjectBuilder } from '../utils';

export const enum ButtonTypeEnum {
  basic = 'basic',
  raised = 'raised',
  stroked = 'stroked',
  flat = 'flat',
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  static DEFAULT_OPTIONS_DATA: ConfirmDialogData = {
    title: undefined,
    content: undefined,
    acceptButton: {
      show: false,
      title: 'Okay',
      type: ButtonTypeEnum.basic,
    },
    rejectButton: {
      show: false,
      title: 'Cancel',
      type: ButtonTypeEnum.basic,
    },
  };

  constructor(@Inject(MAT_DIALOG_DATA) readonly data: ConfirmDialogData) {}

  buttonsArray(): ButtonOption[] {
    return [this.data.rejectButton, this.data.acceptButton]
      .filter((button) => button?.show)
      .filter((button) => !!button) as ButtonOption[];
  }

  public static open(
    matDialog: MatDialog,
    options: Omit<MatDialogConfig<ConfirmDialogComponent>, 'data'> &
      RecursivePartial<{ data: ConfirmDialogData }>
  ): MatDialogRef<ConfirmDialogComponent> {
    const data = ObjectBuilder.newFromBase(
      ConfirmDialogComponent.DEFAULT_OPTIONS_DATA,
      options.data || {}
    );

    return matDialog.open(ConfirmDialogComponent, {
      ...options,
      data,
    });
  }
}

export interface ConfirmDialogData {
  readonly title?: string;
  readonly content?: string;
  readonly acceptButton?: ButtonOption;
  readonly rejectButton?: ButtonOption;
}

export interface ButtonOption {
  readonly show: boolean;
  readonly title: string;
  readonly type: ButtonTypeEnum;
}
