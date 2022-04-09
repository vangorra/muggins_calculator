import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss'],
})
export class AboutDialogComponent {
  private readonly dialogRef: MatDialogRef<AboutDialogComponent>;

  constructor(dialogRef: MatDialogRef<AboutDialogComponent>) {
    this.dialogRef = dialogRef;
  }

  onCloseClick(): void {
    this.dialogRef.close();
  }
}
