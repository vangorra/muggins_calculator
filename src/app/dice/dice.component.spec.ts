import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiceComponent } from './dice.component';
import DieComponent from '../die/die.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ReactiveFormsModule } from '@angular/forms';

describe('DiceComponent', () => {
  let component: DiceComponent;
  let element: Element;
  let fixture: ComponentFixture<DiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatButtonToggleModule, ReactiveFormsModule],
      declarations: [DiceComponent, DieComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiceComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('select faces', () => {
    const emitSpy = spyOn(component.faceChanged, 'emit');
    component.dice = [
      { faceCount: 6, selectedFace: 1 },
      { faceCount: 7, selectedFace: 2 },
      { faceCount: 8, selectedFace: 3 },
    ];
    fixture.detectChanges();

    emitSpy.calls.reset();
    (
      element.querySelector(
        'app-die.die0 mat-button-toggle.face3 button'
      ) as HTMLElement
    ).dispatchEvent(new Event('click'));
    expect(component.faceChanged.emit).toHaveBeenCalledOnceWith([
      { faceCount: 6, selectedFace: 4 },
      { faceCount: 7, selectedFace: 2 },
      { faceCount: 8, selectedFace: 3 },
    ]);

    emitSpy.calls.reset();
    (
      element.querySelector(
        'app-die.die1 mat-button-toggle.face4 button'
      ) as HTMLElement
    ).click();
    expect(component.faceChanged.emit).toHaveBeenCalledOnceWith([
      { faceCount: 6, selectedFace: 4 },
      { faceCount: 7, selectedFace: 5 },
      { faceCount: 8, selectedFace: 3 },
    ]);

    emitSpy.calls.reset();
    (
      element.querySelector(
        'app-die.die2 mat-button-toggle.face5 button'
      ) as HTMLElement
    ).click();
    expect(component.faceChanged.emit).toHaveBeenCalledOnceWith([
      { faceCount: 6, selectedFace: 4 },
      { faceCount: 7, selectedFace: 5 },
      { faceCount: 8, selectedFace: 6 },
    ]);
  });
});
