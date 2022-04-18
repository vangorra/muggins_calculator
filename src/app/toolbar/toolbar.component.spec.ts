import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolbarComponent } from './toolbar.component';
import { ToolbarService } from '../toolbar.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { expect } from '@angular/flex-layout/_private-utils/testing';

describe(ToolbarComponent.name, () => {
  let component: ToolbarComponent;
  let toolbarService: ToolbarService;
  let fixture: ComponentFixture<ToolbarComponent>;
  let element: Element;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatToolbarModule, MatButtonModule, MatIconModule],
      declarations: [ToolbarComponent],
    }).compileComponents();
    toolbarService = TestBed.inject(ToolbarService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement.nativeElement as Element;
    fixture.detectChanges();
  });

  test('confirm defaults', () => {
    expect(element.querySelector('.configTitle')?.textContent).toEqual(
      ToolbarService.DEFAULT_TOOLBAR_CONFIG.title
    );
    expect(element.querySelectorAll('.buttons button')?.length).toEqual(0);
  });

  test('set title', () => {
    toolbarService.set({
      title: 'Test title',
    });
    fixture.detectChanges();
    expect(element.querySelector('.configTitle')?.textContent).toEqual(
      'Test title'
    );
    expect(element.querySelectorAll('.buttons button')?.length).toEqual(0);
  });

  test('set button with icon', () => {
    toolbarService.set({
      buttons: [
        ToolbarService.newButton({
          title: 'button1',
          icon: 'test_icon',
        }),
      ],
    });
    fixture.detectChanges();

    const buttonElement = element.querySelector(
      '.buttons button'
    ) as HTMLButtonElement;
    expect(buttonElement.getAttribute('title')).toEqual('button1');
    expect(buttonElement.getAttribute('aria-label')).toEqual('button1');
    expect(buttonElement.getAttribute('disabled')).toBeFalsy();
    expect(buttonElement.querySelectorAll('.title').length).toEqual(0);

    const iconElement = buttonElement.querySelector('mat-icon') as HTMLElement;
    expect(iconElement.textContent).toEqual('test_icon');
  });

  test('set button without icon', () => {
    toolbarService.set({
      buttons: [
        ToolbarService.newButton({
          title: 'button1',
        }),
      ],
    });
    fixture.detectChanges();

    const buttonElement = element.querySelector(
      '.buttons button'
    ) as HTMLButtonElement;
    expect(buttonElement.getAttribute('title')).toEqual('button1');
    expect(buttonElement.getAttribute('aria-label')).toEqual('button1');
    expect(buttonElement.getAttribute('disabled')).toBeFalsy();
    expect(buttonElement.querySelectorAll('mat-icon').length).toEqual(0);

    const spanElement = buttonElement.querySelector(
      '.title'
    ) as HTMLSpanElement;
    expect(spanElement.textContent).toEqual('button1');
  });

  test('on button click', () => {
    const clickedFn = jest.fn();
    toolbarService.set({
      buttons: [
        ToolbarService.newButton({
          title: 'button1',
          onClick: clickedFn,
        }),
      ],
    });
    fixture.detectChanges();

    const buttonElement = element.querySelector(
      '.buttons button'
    ) as HTMLButtonElement;
    expect(clickedFn).not.toHaveBeenCalled();

    buttonElement.click();
    expect(clickedFn).toHaveBeenCalled();
  });

  test('disable button', () => {
    const disabled = new Subject<boolean>();
    toolbarService.set({
      buttons: [
        ToolbarService.newButton({
          title: 'button1',
          onClick: jest.fn(),
          disabledObserver: () => disabled,
        }),
      ],
    });
    fixture.detectChanges();

    const buttonElement = element.querySelector(
      '.buttons button'
    ) as HTMLButtonElement;
    expect(buttonElement.getAttribute('disabled')).toBeFalsy();

    disabled.next(true);
    fixture.detectChanges();
    expect(buttonElement.getAttribute('disabled')).toBeTruthy();

    disabled.next(false);
    fixture.detectChanges();
    expect(buttonElement.getAttribute('disabled')).toBeFalsy();
  });

  test(ToolbarComponent.prototype.ngOnDestroy.name, () => {
    expect(component.configSubscription?.closed).toBeFalsy();
    const unsubscribeSpy = jest.spyOn(
      component.configSubscription as any,
      'unsubscribe'
    );
    fixture.destroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(component.configSubscription).toBeFalsy();

    unsubscribeSpy.mockReset();
    component.ngOnDestroy();
    expect(unsubscribeSpy).not.toHaveBeenCalled();
    expect(component.configSubscription).toBeFalsy();
  });
});
