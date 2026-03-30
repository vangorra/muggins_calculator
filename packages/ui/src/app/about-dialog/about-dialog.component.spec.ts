import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutDialogComponent } from './about-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe(AboutDialogComponent.name, () => {
  let fixture: ComponentFixture<AboutDialogComponent>;
  let element: Element;
  let closeSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    closeSpy = vi.fn();
    await TestBed.configureTestingModule({
      imports: [AboutDialogComponent],
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
