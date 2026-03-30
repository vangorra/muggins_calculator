import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

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
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    NgClass,
    MatDialogClose,
    MatButtonModule,
  ],
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  buttonsArray(): ButtonOption[] {
    return [this.data.rejectButton, this.data.acceptButton]
      .filter((button) => button?.show)
      .filter((button) => !!button) as ButtonOption[];
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
