import {
  Component,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-scroll-to-top',
  templateUrl: './scroll-to-top.component.html',
  styleUrls: ['./scroll-to-top.component.scss'],
  animations: [
    trigger('slideUpDown', [
      transition(':enter', [
        style({ bottom: '-5em', opacity: 0 }),
        animate('0.25s ease-out', style({ bottom: '*', opacity: '*' })),
      ]),
      transition(':leave', [
        animate('0.25s ease-in', style({ bottom: '-5em', opacity: 0 })),
      ]),
    ]),
  ],
})
export class ScrollToTopComponent implements OnInit, OnChanges, OnDestroy {
  @Input() visibleAfterElementQuery?: string;

  @Input() offsetElementQuery?: string;

  isVisible = false;

  visibleAfterElement?: HTMLElement;

  offsetElement?: HTMLElement;

  private readonly onWindowScrolledEventListener = () =>
    this.onWindowScrolled();

  constructor(private readonly ngZone: NgZone) {}

  ngOnInit(): void {
    window.addEventListener('scroll', this.onWindowScrolledEventListener, true);
  }

  ngOnChanges(change: SimpleChanges): void {
    if (!!change.visibleAfterElementQuery) {
      this.visibleAfterElement = this.maybeQueryForElement(
        change.visibleAfterElementQuery.currentValue
      );
    }

    if (!!change.offsetElementQuery) {
      this.offsetElement = this.maybeQueryForElement(
        change.offsetElementQuery.currentValue
      );
    }
  }

  private maybeQueryForElement(query?: string): HTMLElement | undefined {
    return document.querySelector(query as string) as HTMLElement;
  }

  ngOnDestroy(): void {
    window.removeEventListener(
      'scroll',
      this.onWindowScrolledEventListener,
      true
    );
  }

  onWindowScrolled(): void {
    if (!this.visibleAfterElement) {
      this.isVisible = false;
      return;
    }
    const afterScrollY =
      this.visibleAfterElement.offsetHeight +
      this.visibleAfterElement.offsetTop;
    const offset = this.offsetElement ? this.offsetElement.offsetHeight : 0;
    this.isVisible = window.scrollY > afterScrollY - offset;
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
}
