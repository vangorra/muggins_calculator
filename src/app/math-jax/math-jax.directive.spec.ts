import { MathJaxDirective } from './math-jax.directive';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MathJaxService, MathJaxState } from './math-jax.service';
import { mockMathJaxProvider, newMockMathJaxService } from '../test-utils';

@Component({
  selector: 'app-test-component',
  template: ` <div [appMathJax]>4 = 8 - 4</div> `,
})
class TestComponent {}

describe(MathJaxDirective.name, () => {
  describe('renders', () => {
    let fixture: ComponentFixture<TestComponent>;
    let element: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [TestComponent, MathJaxDirective],
        providers: [mockMathJaxProvider(MathJaxState.initialized)],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(TestComponent);
      element = fixture.nativeElement;
      fixture.detectChanges();
    });

    test('run', () => {
      expect(element.textContent?.startsWith('RENDERED ')).toBeTruthy();
      expect(element.textContent?.endsWith(' RENDERED')).toBeTruthy();
    });
  });

  describe('does not render', () => {
    let fixture: ComponentFixture<TestComponent>;
    let element: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [TestComponent, MathJaxDirective],
        providers: [
          {
            provide: MathJaxService,
            useValue: newMockMathJaxService(MathJaxState.none),
          },
        ],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(TestComponent);
      element = fixture.nativeElement;
      fixture.detectChanges();
    });

    test('run', () => {
      expect(element.textContent?.startsWith('RENDERED ')).toBeFalsy();
      expect(element.textContent?.endsWith(' RENDERED')).toBeFalsy();
    });
  });
});
