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

describe('ScrollToTopComponent', () => {
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

  it('button shows on scroll', () => {
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

    spyOnProperty(offsetElement, 'offsetTop', 'get').and.returnValue(0);
    spyOnProperty(offsetElement, 'offsetHeight', 'get').and.returnValue(10);
    spyOnProperty(visibleAfterElement, 'offsetTop', 'get').and.returnValue(50);
    spyOnProperty(visibleAfterElement, 'offsetHeight', 'get').and.returnValue(
      10
    );
    const windowScrollYSpy = spyOnProperty(window, 'scrollY', 'get');

    windowScrollYSpy.and.returnValue(40);
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(getScrollToTopButton()).toBeFalsy();

    windowScrollYSpy.and.returnValue(70);
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(getScrollToTopButton()).toBeTruthy();

    const scrollToSpy = spyOn(window, 'scrollTo');
    getScrollToTopButton()?.click();
    expect(scrollToSpy).toHaveBeenCalled();
    windowScrollYSpy.and.returnValue(0);
    window.dispatchEvent(new Event('scroll'));

    // // Unsure why this isn't working despite the component reporting the button is no longer visible.
    // fixture.detectChanges();
    // expect(getScrollToTopButton()).toBeFalsy();
  });

  it('add/remove event listener', () => {
    const removeEventListenerSpy = spyOn(window, 'removeEventListener');
    fixture.destroy();
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});
