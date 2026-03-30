import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolbarComponent } from './toolbar.component';
import { ToolbarService } from '../toolbar.service';
import { signal } from '@angular/core';

describe(ToolbarComponent.name, () => {
  let component: ToolbarComponent;
  let toolbarService: ToolbarService;
  let fixture: ComponentFixture<ToolbarComponent>;
  let element: Element;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarComponent],
    }).compileComponents();
    toolbarService = TestBed.inject(ToolbarService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement.nativeElement as Element;
  });

  it('confirm defaults', () => {
    fixture.detectChanges();
    expect(element.querySelector('.configTitle')?.textContent).toEqual(
      ToolbarService.DEFAULT_TOOLBAR_CONFIG.title
    );
    expect(element.querySelectorAll('.buttons button')?.length).toEqual(0);
  });

  it('set title', () => {
    toolbarService.set({
      title: 'Test title',
    });
    fixture.detectChanges();
    expect(element.querySelector('.configTitle')?.textContent).toEqual(
      'Test title'
    );
    expect(element.querySelectorAll('.buttons button')?.length).toEqual(0);
  });

  it('set button with icon', () => {
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

  it('set button without icon', () => {
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

  it('on button click', () => {
    const clickedFn = vi.fn();
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

  it('disable button', () => {
    const disabled = signal(false);
    toolbarService.set({
      buttons: [
        ToolbarService.newButton({
          title: 'button1',
          onClick: vi.fn(),
          disabledSignal: () => disabled,
        }),
      ],
    });
    fixture.detectChanges();

    const buttonElement = element.querySelector(
      '.buttons button'
    ) as HTMLButtonElement;
    expect(buttonElement.getAttribute('disabled')).toBeFalsy();

    disabled.set(true);
    fixture.detectChanges();
    expect(buttonElement.getAttribute('disabled')).toBeTruthy();

    disabled.set(false);
    fixture.detectChanges();
    expect(buttonElement.getAttribute('disabled')).toBeFalsy();
  });
});
