import { TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm-dialog.component';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe(ConfirmDialogComponent.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, MatButtonModule, NoopAnimationsModule],
      declarations: [ConfirmDialogComponent],
    }).compileComponents();
  });

  test('empty values', () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, {
      useValue: {},
    });
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const element = fixture.debugElement.nativeElement as Element;
    fixture.detectChanges();

    expect(element.querySelectorAll('[mat-dialog-title]').length).toEqual(0);
    expect(element.querySelectorAll('[mat-dialog-content]').length).toEqual(0);
    expect(
      element.querySelectorAll('mat-dialog-actions button').length
    ).toEqual(0);
  });

  test('set title', () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, {
      useValue: {
        title: 'Test title',
      },
    });
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const element = fixture.debugElement.nativeElement as Element;
    fixture.detectChanges();

    expect(element.querySelector('[mat-dialog-title]')?.textContent).toEqual(
      'Test title'
    );
    expect(element.querySelectorAll('[mat-dialog-content]').length).toEqual(0);
    expect(
      element.querySelectorAll('mat-dialog-actions button').length
    ).toEqual(0);
  });

  test('set content', () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, {
      useValue: {
        content: 'Test content',
      },
    });
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const element = fixture.debugElement.nativeElement as Element;
    fixture.detectChanges();

    expect(element.querySelectorAll('[mat-dialog-title]').length).toEqual(0);
    expect(element.querySelector('[mat-dialog-content]')?.textContent).toEqual(
      'Test content'
    );
    expect(
      element.querySelectorAll('mat-dialog-actions button').length
    ).toEqual(0);
  });

  test('set basic and raised buttons', () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, {
      useValue: {
        acceptButton: {
          show: true,
          title: 'Accept',
          type: 'basic',
        },
        rejectButton: {
          show: true,
          title: 'Reject',
          type: 'raised',
        },
      },
    });
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const element = fixture.debugElement.nativeElement as Element;
    fixture.detectChanges();

    expect(element.querySelectorAll('[mat-dialog-title]').length).toEqual(0);
    expect(element.querySelectorAll('[mat-dialog-content]').length).toEqual(0);
    expect(
      element.querySelectorAll('mat-dialog-actions button').length
    ).toEqual(2);

    const acceptButton = element.querySelector(
      'button.acceptButton'
    ) as HTMLButtonElement;
    expect(acceptButton.hasAttribute('mat-button')).toBeTruthy();
    expect(acceptButton.textContent?.trim()).toEqual('Accept');

    const rejectButton = element.querySelector(
      'button.rejectButton'
    ) as HTMLButtonElement;
    expect(rejectButton.hasAttribute('mat-raised-button')).toBeTruthy();
    expect(rejectButton.textContent?.trim()).toEqual('Reject');
  });

  test('set basic and raised buttons', () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, {
      useValue: {
        acceptButton: {
          show: true,
          title: 'Accept',
          type: 'stroked',
        },
        rejectButton: {
          show: true,
          title: 'Reject',
          type: 'flat',
        },
      },
    });
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const element = fixture.debugElement.nativeElement as Element;
    fixture.detectChanges();

    expect(element.querySelectorAll('[mat-dialog-title]').length).toEqual(0);
    expect(element.querySelectorAll('[mat-dialog-content]').length).toEqual(0);
    expect(
      element.querySelectorAll('mat-dialog-actions button').length
    ).toEqual(2);

    const acceptButton = element.querySelector(
      'button.acceptButton'
    ) as HTMLButtonElement;
    expect(acceptButton.hasAttribute('mat-stroked-button')).toBeTruthy();
    expect(acceptButton.textContent?.trim()).toEqual('Accept');

    const rejectButton = element.querySelector(
      'button.rejectButton'
    ) as HTMLButtonElement;
    expect(rejectButton.hasAttribute('mat-flat-button')).toBeTruthy();
    expect(rejectButton.textContent?.trim()).toEqual('Reject');
  });

  test('open with static', () => {
    const dialogRef = {};
    const matDialog = {
      open: jest.fn().mockReturnValue(dialogRef),
    } as any as MatDialog;

    const dialogConfig = {};
    const returnedDialogRef = ConfirmDialogComponent.open(
      matDialog,
      dialogConfig
    );
    expect(matDialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, {
      data: ConfirmDialogComponent.DEFAULT_OPTIONS_DATA,
    });
    expect(returnedDialogRef).toBe(dialogRef as any);
  });
});
