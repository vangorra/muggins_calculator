import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MathJaxComponent } from './math-jax.component';

describe('MathJaxComponent', () => {
  let component: MathJaxComponent;
  let fixture: ComponentFixture<MathJaxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MathJaxComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MathJaxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
