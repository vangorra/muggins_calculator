import { TestBed } from '@angular/core/testing';

import { ToolbarService } from './toolbar.service';

describe(ToolbarService.name, () => {
  let service: ToolbarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToolbarService);
  });

  /**
   * Only doing this to satisfy coverage requirements. These functions do nothing.
   */
  it('run noop functions', () => {
    expect(ToolbarService.NOOP_ONCLICK()).toBeFalsy();
    expect(ToolbarService.NOOP_OBSERVER()).toBeTruthy();
  });

  it('should be created', () => {
    expect(service.config.getValue()).toEqual(
      ToolbarService.DEFAULT_TOOLBAR_CONFIG
    );

    service.set({
      title: 'Test title',
      buttons: [
        ToolbarService.newButton({
          title: 'Button1',
        }),
      ],
    });

    expect(service.config.getValue()).toEqual({
      title: 'Test title',
      buttons: [
        ToolbarService.newButton({
          icon: undefined,
          title: 'Button1',
          onClick: ToolbarService.NOOP_ONCLICK,
        }),
      ],
    });
  });
});
