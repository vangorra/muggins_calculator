import { AfterViewInit, Directive, ElementRef } from '@angular/core';
import { MathJaxService, MathJaxState } from './math-jax.service';
import { takeWhile } from 'rxjs';

@Directive({
  selector: '[appMathJax]',
})
export class MathJaxDirective implements AfterViewInit {
  constructor(
    private readonly elementRef: ElementRef,
    private readonly mathJaxService: MathJaxService
  ) {}

  ngAfterViewInit(): void {
    this.mathJaxService.state
      .pipe(
        takeWhile(
          (state) =>
            state === MathJaxState.none || state === MathJaxState.initialized
        )
      )
      .subscribe((state) => {
        if (state === MathJaxState.none) {
          console.error(
            `Failed to load ${MathJaxDirective.name} as the service is not started. Add ${MathJaxService.name} to you app component constructor and run 'this.mathJaxService.start()' during ngOnInit().`
          );
          return;
        }

        this.render();
        return;
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
