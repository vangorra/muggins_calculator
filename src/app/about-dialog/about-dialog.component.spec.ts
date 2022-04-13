import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutDialogComponent } from './about-dialog.component';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import createSpy = jasmine.createSpy;
import Spy = jasmine.Spy;

describe('AboutDialogComponent', () => {
  let fixture: ComponentFixture<AboutDialogComponent>;
  let element: Element;
  let closeSpy: Spy;

  beforeEach(async () => {
    closeSpy = createSpy();
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

  it('close', () => {
    expect(closeSpy).not.toHaveBeenCalled();
    const button = element.querySelector(
      'button[mat-dialog-close]'
    ) as HTMLButtonElement;
    button.click();
    expect(closeSpy).toHaveBeenCalled();
  });
});
