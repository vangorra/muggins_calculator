import { MathJaxDirective } from './math-jax.directive';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MathJaxService, MathJaxState } from './math-jax.service';
import { newMockMathJaxService } from '../test-utils.spec';
import { expect } from '@angular/flex-layout/_private-utils/testing';

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
        providers: [
          {
            provide: MathJaxService,
            useValue: newMockMathJaxService(MathJaxState.initialized),
          },
        ],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(TestComponent);
      element = fixture.nativeElement;
      fixture.detectChanges();
    });

    it('run', () => {
      expect(element.innerText.startsWith('RENDERED ')).toBeTruthy();
      expect(element.innerText.endsWith(' RENDERED')).toBeTruthy();
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

    it('run', () => {
      expect(element.innerText.startsWith('RENDERED ')).toBeFalsy();
      expect(element.innerText.endsWith(' RENDERED')).toBeFalsy();
    });
  });
});
