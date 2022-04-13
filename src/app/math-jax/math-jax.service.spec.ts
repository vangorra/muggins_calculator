import { TestBed } from '@angular/core/testing';

import { MathJaxService, MathJaxState } from './math-jax.service';
import { MathJaxInputLoaderEnum, MathJaxOutputLoaderEnum } from './utils';
import clock = jasmine.clock;

describe('MathJaxService', () => {
  let service: MathJaxService;

  beforeEach(() => {
    clock().install();
    TestBed.configureTestingModule({});
    service = TestBed.inject(MathJaxService);
  });

  afterEach(() => {
    clock().uninstall();

    // Clear out mathjax object.
    const mathJax = window.MathJax as any;
    if (!!mathJax) {
      Object.keys(mathJax).forEach((key) => {
        delete mathJax[key];
      });
    }
  });

  it('start', async () => {
    const startPollForInitializedSpy = spyOn(
      service,
      'startPollForInitialized'
    ).and.callThrough();

    expect(document.getElementById(MathJaxService.SCRIPT_ID)).toBeFalsy();
    expect(service.state.getValue()).toEqual(MathJaxState.none);

    service.start();
    expect(document.getElementById(MathJaxService.SCRIPT_ID)).toBeTruthy();
    expect(service.state.getValue()).toEqual(MathJaxState.loadingAssets);

    // Script added to document never actually loads in a place where our test can see it.
    // Simulate the script loaded.
    service.startPollForInitialized();

    expect(service.state.getValue()).toEqual(MathJaxState.initializing);

    window.MathJax.typeset = () => undefined;
    clock().tick(MathJaxService.POLL_INTERVAL * 1.5);
    expect(service.initializeCheckInterval).toBeFalsy();
    expect(service.state.getValue()).toEqual(MathJaxState.initialized);

    // Attempt to start again, which does nothing.
    startPollForInitializedSpy.calls.reset();
    service.start();
    expect(startPollForInitializedSpy).toHaveBeenCalled();
    expect(service.state.getValue()).toEqual(MathJaxState.initialized);
  }, 10000);

  it('destroy stops poll', () => {
    service.state.next(MathJaxState.initialized);

    service.ngOnDestroy();
    expect(service.initializeCheckInterval).toBeFalsy();
    expect(service.state.getValue()).toEqual(MathJaxState.none);
  });

  it('Get render function maps correctly', () => {
    window.MathJax.asciimath2svg = 'AAAAA' as any;

    const service1 = new MathJaxService({
      inputLoader: MathJaxInputLoaderEnum.asciimath,
      outputLoader: MathJaxOutputLoaderEnum.svg,
    });
    expect(service1.getRenderFunction()).toBe(MathJax.asciimath2svg);

    const service2 = new MathJaxService({
      inputLoader: MathJaxInputLoaderEnum.asciimath,
      outputLoader: 'BBB' as any,
    });
    expect(service2.getRenderFunction()).toBe(
      MathJaxService.NOOP_RENDER_FUNCTION
    );
  });

  it('noop render function returns span with original text', () => {
    expect(MathJaxService.NOOP_RENDER_FUNCTION('AAAAA').textContent).toEqual(
      'AAAAA'
    );
  });
});
