import { TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm-dialog.component';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import createSpy = jasmine.createSpy;

describe('ConfirmDialogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, MatButtonModule, NoopAnimationsModule],
      declarations: [ConfirmDialogComponent],
    }).compileComponents();
  });

  it('empty values', () => {
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

  it('set title', () => {
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

  it('set content', () => {
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

  it('set basic and raised buttons', () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, {
      useValue: {
        acceptButton: {
          show: true,
          title: 'Accept',
          color: 'primary',
          type: 'basic',
        },
        rejectButton: {
          show: true,
          title: 'Reject',
          color: 'accent',
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
    expect(acceptButton.getAttribute('ng-reflect-color')).toEqual('primary');
    expect(acceptButton.hasAttribute('mat-button')).toBeTrue();
    expect(acceptButton.textContent?.trim()).toEqual('Accept');

    const rejectButton = element.querySelector(
      'button.rejectButton'
    ) as HTMLButtonElement;
    expect(rejectButton.getAttribute('ng-reflect-color')).toEqual('accent');
    expect(rejectButton.hasAttribute('mat-raised-button')).toBeTrue();
    expect(rejectButton.textContent?.trim()).toEqual('Reject');
  });

  it('set basic and raised buttons', () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, {
      useValue: {
        acceptButton: {
          show: true,
          title: 'Accept',
          color: 'warn',
          type: 'stroked',
        },
        rejectButton: {
          show: true,
          title: 'Reject',
          color: 'warn',
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
    expect(acceptButton.getAttribute('ng-reflect-color')).toEqual('warn');
    expect(acceptButton.hasAttribute('mat-stroked-button')).toBeTrue();
    expect(acceptButton.textContent?.trim()).toEqual('Accept');

    const rejectButton = element.querySelector(
      'button.rejectButton'
    ) as HTMLButtonElement;
    expect(rejectButton.getAttribute('ng-reflect-color')).toEqual('warn');
    expect(rejectButton.hasAttribute('mat-flat-button')).toBeTrue();
    expect(rejectButton.textContent?.trim()).toEqual('Reject');
  });

  it('open with static', () => {
    const dialogRef = {};
    const matDialog = {
      open: createSpy().and.returnValue(dialogRef),
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
