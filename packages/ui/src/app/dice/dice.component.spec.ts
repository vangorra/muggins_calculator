import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiceComponent } from './dice.component';

describe(DiceComponent.name, () => {
  let component: DiceComponent;
  let element: Element;
  let fixture: ComponentFixture<DiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiceComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiceComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('select faces', () => {
    const emitSpy = vi.spyOn(component.faceChanged, 'emit');
    component.dice = [
      { index: 0, faceCount: 6, selectedFace: 1 },
      { index: 1, faceCount: 7, selectedFace: 2 },
      { index: 2, faceCount: 8, selectedFace: 3 },
    ];
    fixture.detectChanges();

    emitSpy.mockClear();
    (
      element.querySelector(
        'app-die.die0 mat-button-toggle.face3 button'
      ) as HTMLElement
    ).dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(emitSpy).toHaveBeenCalledWith([
      { index: 0, faceCount: 6, selectedFace: 4 },
      { index: 1, faceCount: 7, selectedFace: 2 },
      { index: 2, faceCount: 8, selectedFace: 3 },
    ]);

    emitSpy.mockClear();
    (
      element.querySelector(
        'app-die.die1 mat-button-toggle.face4 button'
      ) as HTMLElement
    ).click();
    fixture.detectChanges();
    expect(emitSpy).toHaveBeenCalledWith([
      { index: 0, faceCount: 6, selectedFace: 4 },
      { index: 1, faceCount: 7, selectedFace: 5 },
      { index: 2, faceCount: 8, selectedFace: 3 },
    ]);

    emitSpy.mockClear();
    (
      element.querySelector(
        'app-die.die2 mat-button-toggle.face5 button'
      ) as HTMLElement
    ).click();
    fixture.detectChanges();
    expect(emitSpy).toHaveBeenCalledWith([
      { index: 0, faceCount: 6, selectedFace: 4 },
      { index: 1, faceCount: 7, selectedFace: 5 },
      { index: 2, faceCount: 8, selectedFace: 6 },
    ]);
  });
});
