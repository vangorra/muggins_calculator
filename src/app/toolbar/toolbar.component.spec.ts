import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolbarComponent } from './toolbar.component';
import { ToolbarService } from '../toolbar.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import createSpy = jasmine.createSpy;

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let toolbarService: ToolbarService;
  let fixture: ComponentFixture<ToolbarComponent>;
  let element: Element;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatToolbarModule, MatButtonModule],
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

  it('confirm defaults', () => {
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
    expect(buttonElement.title).toEqual('button1');
    expect(buttonElement.ariaLabel).toEqual('button1');
    expect(buttonElement.disabled).toBeFalse();
    expect(buttonElement.querySelectorAll('.title').length).toEqual(0);

    const iconElement = buttonElement.querySelector('mat-icon') as HTMLElement;
    expect(iconElement.innerText).toEqual('test_icon');
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
    expect(buttonElement.title).toEqual('button1');
    expect(buttonElement.ariaLabel).toEqual('button1');
    expect(buttonElement.disabled).toBeFalse();
    expect(buttonElement.querySelectorAll('mat-icon').length).toEqual(0);

    const spanElement = buttonElement.querySelector(
      '.title'
    ) as HTMLSpanElement;
    expect(spanElement.innerText).toEqual('button1');
  });

  it('on button click', () => {
    const clickedFn = createSpy();
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

  it('destroy unsubscribes', () => {
    expect(component.configSubscription?.closed).toBeFalsy();
    fixture.destroy();
    expect(component.configSubscription?.closed).toBeTruthy();
  });
});
