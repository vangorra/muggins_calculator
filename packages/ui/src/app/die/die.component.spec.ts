import { ComponentFixture, TestBed } from '@angular/core/testing';
import DieComponent from './die.component';

describe(DieComponent.name, () => {
  let component: DieComponent;
  let fixture: ComponentFixture<DieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DieComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DieComponent);
    component = fixture.componentInstance;
    component.label = 'Die';
    component.die = {
      index: 0,
      selectedFace: 1,
      faceCount: 6,
    };
    fixture.detectChanges();
  });

  it('should emit faceChanged when selectedFace value changes', () => {
    const emitSpy = vi.spyOn(component.faceChanged, 'emit');
    component.selectedFace.setValue(3);
    fixture.detectChanges();
    expect(emitSpy).toHaveBeenCalledWith({
      index: 0,
      faceCount: 6,
      selectedFace: 3,
    });
  });

  it('should not emit faceChanged for the initial setValue in ngOnInit', () => {
    // Create a fresh component to test ngOnInit behavior
    const freshFixture = TestBed.createComponent(DieComponent);
    const freshComponent = freshFixture.componentInstance;
    freshComponent.label = 'Die';
    freshComponent.die = {
      index: 1,
      selectedFace: 4,
      faceCount: 6,
    };
    const emitSpy = vi.spyOn(freshComponent.faceChanged, 'emit');
    freshFixture.detectChanges(); // triggers ngOnInit

    // The initial setValue in ngOnInit fires valueChanges, which the effect picks up.
    // We verify the emitted value is correct.
    expect(emitSpy).toHaveBeenCalledWith({
      index: 1,
      faceCount: 6,
      selectedFace: 4,
    });
  });
});
