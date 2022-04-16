import { TestBed } from '@angular/core/testing';

import { MathJaxService, MathJaxState } from './math-jax.service';
import { MathJaxInputLoaderEnum, MathJaxOutputLoaderEnum } from './utils';

jest.useFakeTimers();

describe(MathJaxService.name, () => {
  let service: MathJaxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MathJaxService);
  });

  afterEach(() => {
    // Clear out mathjax object.
    const mathJax = window.MathJax as any;
    if (!!mathJax) {
      Object.keys(mathJax).forEach((key) => {
        delete mathJax[key];
      });
    }
  });

  test('start', async () => {
    const startPollForInitializedSpy = jest.spyOn(
      service,
      'startPollForInitialized'
    );

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
    jest.advanceTimersByTime(MathJaxService.POLL_INTERVAL * 1.5);
    expect(service.initializeCheckInterval).toBeFalsy();
    expect(service.state.getValue()).toEqual(MathJaxState.initialized);

    // Attempt to start again, which does nothing.
    startPollForInitializedSpy.mockReset();
    service.start();
    expect(startPollForInitializedSpy).toHaveBeenCalled();
    expect(service.state.getValue()).toEqual(MathJaxState.initialized);
  }, 10000);

  test('destroy stops poll', () => {
    service.state.next(MathJaxState.initialized);

    service.ngOnDestroy();
    expect(service.initializeCheckInterval).toBeFalsy();
    expect(service.state.getValue()).toEqual(MathJaxState.none);
  });

  test('Get render function maps correctly', () => {
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

  test('noop render function returns span with original text', () => {
    expect(MathJaxService.NOOP_RENDER_FUNCTION('AAAAA').textContent).toEqual(
      'AAAAA'
    );
  });
});
