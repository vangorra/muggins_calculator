import { ComponentFixture, TestBed } from '@angular/core/testing';
import DieComponent from './die.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

describe(DieComponent.name, () => {
  let component: DieComponent;
  let fixture: ComponentFixture<DieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatButtonToggleModule],
      declarations: [DieComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DieComponent);
    component = fixture.componentInstance;
    component.label = 'Die';
    component.die = {
      selectedFace: 1,
      faceCount: 6,
    };
    fixture.detectChanges();
  });

  test.only('destroy unsubscribes', () => {
    expect(component.selectedFaceSubscription?.closed).toBeFalsy();
    fixture.destroy();
    expect(component.selectedFaceSubscription).toBeFalsy();
    component.ngOnDestroy();
    expect(component.selectedFaceSubscription).toBeFalsy();
  });
});
