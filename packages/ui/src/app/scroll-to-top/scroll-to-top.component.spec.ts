import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrollToTopComponent } from './scroll-to-top.component';
import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

const mockDomRect = (overrides: Partial<DOMRect> = {}): DOMRect => ({
  bottom: 0,
  top: 0,
  left: 0,
  right: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  toJSON: () => {},
  ...overrides,
});

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [ScrollToTopComponent],
  template: `
    <div class="offsetElement"></div>
    <div class="visibleAfterElement"></div>
    <app-scroll-to-top
      class="scrollToTopElement"
      [offsetElementQuery]="'.offsetElement'"
      [visibleAfterElementQuery]="'.visibleAfterElement'"
      [beforeScroll]="beforeScroll"
    ></app-scroll-to-top>
  `,
})
class AppTestComponent {
  beforeScroll = () => Promise.resolve();
}

describe(ScrollToTopComponent.name + ' through parent element', () => {
  let fixture: ComponentFixture<AppTestComponent>;
  let scrollToSpy: ReturnType<typeof vi.fn>;
  let offsetElement: HTMLDivElement;
  let visibleAfterElement: HTMLDivElement;
  let scrollToTopElement: HTMLElement;
  let getScrollToTopButton: () => HTMLButtonElement | null;

  beforeEach(async () => {
    scrollToSpy = vi.fn();
    document.documentElement.scrollTo = scrollToSpy as any;

    await TestBed.configureTestingModule({
      imports: [AppTestComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppTestComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as Element;
    offsetElement = element.querySelector('.offsetElement') as HTMLDivElement;
    visibleAfterElement = element.querySelector(
      '.visibleAfterElement'
    ) as HTMLDivElement;
    scrollToTopElement = element.querySelector(
      '.scrollToTopElement'
    ) as HTMLElement;
    getScrollToTopButton = () =>
      scrollToTopElement.querySelector('button') as HTMLButtonElement | null;
  });

  const makeButtonVisible = () => {
    vi.spyOn(offsetElement, 'offsetHeight', 'get').mockReturnValue(64);
    vi.spyOn(visibleAfterElement, 'getBoundingClientRect').mockReturnValue(
      mockDomRect({ bottom: 10 })
    );
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
  };

  it('button is hidden initially', () => {
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(getScrollToTopButton()).toBeFalsy();
  });

  it('button is hidden when visibleAfterElement is still visible', () => {
    vi.spyOn(offsetElement, 'offsetHeight', 'get').mockReturnValue(64);
    vi.spyOn(visibleAfterElement, 'getBoundingClientRect').mockReturnValue(
      mockDomRect({ bottom: 100 })
    );
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(getScrollToTopButton()).toBeFalsy();
  });

  it('button shows when visibleAfterElement scrolls above offset', () => {
    makeButtonVisible();
    expect(getScrollToTopButton()).toBeTruthy();
  });

  it(
    'clicking button calls scrollTo and hides button after timeout',
    { timeout: 10000 },
    async () => {
      makeButtonVisible();

      getScrollToTopButton()?.click();
      // Allow microtasks (beforeScroll promise) to resolve.
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

      // Simulate page scrolled back to top BEFORE the 500ms timeout fires,
      // so onWindowScrolled() inside the timeout sees the element as visible.
      vi.spyOn(visibleAfterElement, 'getBoundingClientRect').mockReturnValue(
        mockDomRect({ bottom: 200 })
      );

      // Wait for the 500ms scrolling timeout to complete.
      await new Promise((resolve) => setTimeout(resolve, 600));
      fixture.detectChanges();

      expect(getScrollToTopButton()).toBeFalsy();
    }
  );

  it(
    'calls beforeScroll callback when scrolling to top',
    { timeout: 10000 },
    async () => {
      const beforeScrollSpy = vi.fn().mockResolvedValue(undefined);
      fixture.componentInstance.beforeScroll = beforeScrollSpy;
      fixture.detectChanges();

      makeButtonVisible();
      getScrollToTopButton()?.click();
      // Allow microtasks (beforeScroll promise) to resolve.
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(beforeScrollSpy).toHaveBeenCalled();
    }
  );

  it('removes event listener on destroy', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    fixture.destroy();
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});

describe(ScrollToTopComponent.name, () => {
  let fixture: ComponentFixture<ScrollToTopComponent>;
  let component: ScrollToTopComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollToTopComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScrollToTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('isVisible is false when no visibleAfterElementQuery is set', () => {
    expect(component.isVisible).toBeFalsy();
    component.onWindowScrolled();
    expect(component.isVisible).toBeFalsy();
  });

  it('isVisible is false when visibleAfterElementQuery does not match any element', () => {
    component.visibleAfterElementQuery = '.nonexistent-element';
    component.onWindowScrolled();
    expect(component.isVisible).toBeFalsy();
  });

  it('scrolling flag prevents visibility updates', () => {
    component['scrolling'] = true;
    component.isVisible = true;
    component.onWindowScrolled();
    expect(component.isVisible).toBeTruthy();
  });

  it('isVisible is true when no offsetElementQuery and rect.bottom < 0', () => {
    const el = document.createElement('div');
    el.classList.add('test-visible-after');
    document.body.appendChild(el);

    component.visibleAfterElementQuery = '.test-visible-after';
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(
      mockDomRect({ bottom: -10 })
    );

    component.onWindowScrolled();
    expect(component.isVisible).toBeTruthy();

    document.body.removeChild(el);
  });

  it('offset defaults to 0 when offsetElementQuery element is not found', () => {
    const el = document.createElement('div');
    el.classList.add('test-visible-after-2');
    document.body.appendChild(el);

    component.visibleAfterElementQuery = '.test-visible-after-2';
    component.offsetElementQuery = '.nonexistent-offset';
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(
      mockDomRect({ bottom: -10 })
    );

    component.onWindowScrolled();
    // offset = 0, rect.bottom = -10, -10 < 0 = true
    expect(component.isVisible).toBeTruthy();

    document.body.removeChild(el);
  });

  it(
    'scrollToTop sets scrolling flag and calls scrollTo',
    { timeout: 10000 },
    async () => {
      const scrollToSpy = vi.fn();
      document.documentElement.scrollTo = scrollToSpy as any;
      const beforeScrollSpy = vi.fn().mockResolvedValue(undefined);
      component.beforeScroll = beforeScrollSpy;
      component.isVisible = true;

      await component.scrollToTop();

      expect(component.isVisible).toBeFalsy();
      expect(component['scrolling']).toBeTruthy();
      expect(beforeScrollSpy).toHaveBeenCalled();
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

      // Wait for the 500ms timeout.
      await new Promise((resolve) => setTimeout(resolve, 600));
      expect(component['scrolling']).toBeFalsy();
    }
  );
});
