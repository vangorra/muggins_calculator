import { Directive, effect, ElementRef, inject } from '@angular/core';
import { MathJaxService, MathJaxState } from './math-jax.service';

@Directive({
  selector: '[appMathJax]',
  standalone: true,
})
export class MathJaxDirective {
  private readonly elementRef = inject(ElementRef);
  private readonly mathJaxService = inject(MathJaxService);

  constructor() {
    effect(() => {
      const state = this.mathJaxService.state();
      if (state === MathJaxState.initialized) {
        this.render();
      }
    });
  }

  render(): void {
    const containerElement = this.elementRef.nativeElement as HTMLElement;
    const equationText = containerElement.textContent + '';

    const renderedElement =
      this.mathJaxService.getRenderFunction()(equationText);

    containerElement.setAttribute('data-equation', equationText);
    containerElement.replaceChildren(renderedElement);
  }
}
