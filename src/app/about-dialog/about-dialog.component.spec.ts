import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutDialogComponent } from './about-dialog.component';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

describe(AboutDialogComponent.name, () => {
  let fixture: ComponentFixture<AboutDialogComponent>;
  let element: Element;
  let closeSpy: jest.Mock;

  beforeEach(async () => {
    closeSpy = jest.fn();
    await TestBed.configureTestingModule({
      declarations: [AboutDialogComponent],
      imports: [MatDialogModule, MatButtonModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: closeSpy } },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutDialogComponent);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  test('close', () => {
    expect(closeSpy).not.toHaveBeenCalled();
    const button = element.querySelector(
      'button[mat-dialog-close]'
    ) as HTMLButtonElement;
    button.click();
    expect(closeSpy).toHaveBeenCalled();
  });
});
