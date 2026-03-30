import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { MatFabButton } from '@angular/material/button';

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
  imports: [MatIcon, MatFabButton],
})
export class ScrollToTopComponent implements OnInit, OnDestroy {
  @Input() visibleAfterElementQuery?: string;

  @Input() offsetElementQuery?: string;

  @Input() beforeScroll: () => Promise<void> = () => Promise.resolve();

  isVisible = false;

  private scrolling = false;

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly onScrollListener = () => this.onWindowScrolled();

  ngOnInit(): void {
    window.addEventListener('scroll', this.onScrollListener, true);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScrollListener, true);
  }

  onWindowScrolled(): void {
    if (this.scrolling) {
      return;
    }

    const visibleAfterElement = this.visibleAfterElementQuery
      ? (document.querySelector(this.visibleAfterElementQuery) as HTMLElement)
      : undefined;

    if (!visibleAfterElement) {
      this.isVisible = false;
      return;
    }

    const rect = visibleAfterElement.getBoundingClientRect();
    const offset = this.offsetElementQuery
      ? (document.querySelector(this.offsetElementQuery) as HTMLElement)
          ?.offsetHeight ?? 0
      : 0;

    this.isVisible = rect.bottom < offset;
    this.cdr.markForCheck();
  }

  async scrollToTop() {
    this.scrolling = true;
    this.isVisible = false;
    this.cdr.markForCheck();

    await this.beforeScroll();

    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });

    // Wait for smooth scroll to finish before re-enabling visibility checks.
    setTimeout(() => {
      this.scrolling = false;
      this.onWindowScrolled();
    }, 500);
  }
}
