import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrollToTopComponent } from './scroll-to-top.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Component } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-test',
  template: `
    <div class="offsetElement"></div>
    <div class="visibleAfterElement"></div>
    <app-scroll-to-top
      class="scrollToTopElement"
      [offsetElementQuery]="'.offsetElement'"
      [visibleAfterElementQuery]="'.visibleAfterElement'"
    ></app-scroll-to-top>
  `,
})
class AppTestComponent {}

const scrollToSpy = jest.fn();
global.scrollTo = scrollToSpy;

describe(ScrollToTopComponent.name + ' through parent element', () => {
  let fixture: ComponentFixture<AppTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatButtonModule, MatIconModule, NoopAnimationsModule],
      declarations: [ScrollToTopComponent, AppTestComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppTestComponent);
    fixture.detectChanges();
  });

  test('button shows on scroll', async () => {
    const element = fixture.nativeElement as Element;
    const offsetElement = element.querySelector(
      '.offsetElement'
    ) as HTMLDivElement;
    const visibleAfterElement = element.querySelector(
      '.visibleAfterElement'
    ) as HTMLDivElement;
    const scrollToTopElement = element.querySelector(
      '.scrollToTopElement'
    ) as HTMLElement;
    const getScrollToTopButton = () =>
      scrollToTopElement.querySelector('button') as
        | HTMLButtonElement
        | undefined;

    window.dispatchEvent(new Event('scroll'));
    expect(getScrollToTopButton()).toBeFalsy();

    jest.spyOn(offsetElement, 'offsetTop', 'get').mockReturnValue(0);
    jest.spyOn(offsetElement, 'offsetHeight', 'get').mockReturnValue(10);
    jest.spyOn(visibleAfterElement, 'offsetTop', 'get').mockReturnValue(50);
    jest.spyOn(visibleAfterElement, 'offsetHeight', 'get').mockReturnValue(10);

    const setScrollY = (value: number) =>
      Object.defineProperty(window, 'scrollY', {
        value,
      });

    setScrollY(40);
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(getScrollToTopButton()).toBeFalsy();

    setScrollY(70);
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(getScrollToTopButton()).toBeTruthy();

    getScrollToTopButton()?.click();
    expect(scrollToSpy).toHaveBeenCalled();
    setScrollY(0);
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    // wait for animation to finish and confirm the button is gone.
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(getScrollToTopButton()).toBeFalsy();
  });

  test('add/remove event listener', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    fixture.destroy();
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});

describe(ScrollToTopComponent.name, () => {
  let fixture: ComponentFixture<ScrollToTopComponent>;
  let component: ScrollToTopComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatButtonModule, MatIconModule, NoopAnimationsModule],
      declarations: [ScrollToTopComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScrollToTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  test('onWindowScrolled sets to not visible when visibleAfterElement is falsey', () => {
    expect(component.isVisible).toBeFalsy();
    component.onWindowScrolled();
    expect(component.isVisible).toBeFalsy();

    window.scrollY = 20;
    component.visibleAfterElement = document.createElement('span');
    component.onWindowScrolled();
    expect(component.isVisible).toBeTruthy();
  });
});
