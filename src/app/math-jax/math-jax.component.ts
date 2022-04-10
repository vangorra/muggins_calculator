import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { MathJaxService } from '../math-jax.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-math-jax',
  templateUrl: './math-jax.component.html',
  styleUrls: ['./math-jax.component.scss'],
})
export class MathJaxComponent implements OnDestroy, AfterViewInit {
  @ViewChild('renderedEquationContainer')
  renderedEquationContainer?: ElementRef;

  @Input() equation!: string;

  isRendered = false;

  private initializedSubscription?: Subscription;

  constructor(private readonly mathJaxService: MathJaxService) {}

  ngAfterViewInit(): void {
    this.initializedSubscription = this.mathJaxService.initialized.subscribe(
      (isInitialized) => {
        if (isInitialized) {
          this.render();
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.initializedSubscription?.unsubscribe();
  }

  async render(): Promise<void> {
    const containerElement: HTMLElement = this.renderedEquationContainer
      ?.nativeElement as HTMLElement;
    const renderedElement = await MathJax.asciimath2svgPromise(this.equation);
    containerElement.append(renderedElement);

    this.isRendered = true;
  }
}
