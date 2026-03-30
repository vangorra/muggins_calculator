import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MathJaxService, MathJaxState } from './math-jax.service';
import {
  MathJaxConfig,
  MathJaxInputLoaderEnum,
  MathJaxOutputLoaderEnum,
} from './utils';

vi.useFakeTimers();

describe(MathJaxService.name, () => {
  let service: MathJaxService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MathJaxConfig,
          useValue: {
            inputLoader: MathJaxInputLoaderEnum.asciimath,
            outputLoader: MathJaxOutputLoaderEnum.svg,
          } as MathJaxConfig,
        },
      ],
    });
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
    vi.restoreAllMocks();
  });

  it('start', async () => {
    const startPollForInitializedSpy = vi.spyOn(
      service,
      'startPollForInitialized'
    );
    const scriptElement = document.createElement('script');
    const createElementOriginal = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        if (tag === 'script') {
          return scriptElement;
        }
        return createElementOriginal(tag);
      });

    expect(document.getElementById(MathJaxService.SCRIPT_ID)).toBeFalsy();
    expect(service.state()).toEqual(MathJaxState.none);

    service.start();
    expect(document.getElementById(MathJaxService.SCRIPT_ID)).toBeTruthy();
    expect(service.state()).toEqual(MathJaxState.loadingAssets);

    createElementSpy.mockRestore();
    expect(scriptElement.id).toEqual(MathJaxService.SCRIPT_ID);
    expect(scriptElement.type).toEqual('text/javascript');
    expect(scriptElement.src).toContain('/mathjax/es5/startup.js');
    expect(scriptElement.onload).toBeTruthy();
    (scriptElement.onload as any)();

    expect(service.state()).toEqual(MathJaxState.initializing);

    window.MathJax.typeset = () => undefined;
    vi.advanceTimersByTime(MathJaxService.POLL_INTERVAL * 1.5);
    expect(service.initializeCheckInterval).toBeFalsy();
    expect(service.state()).toEqual(MathJaxState.initialized);

    // Attempt to start again, which does nothing.
    startPollForInitializedSpy.mockReset();
    service.start();
    expect(startPollForInitializedSpy).toHaveBeenCalled();
    expect(service.state()).toEqual(MathJaxState.initialized);
  }, 10000);

  it('destroy stops poll', () => {
    service.state.set(MathJaxState.initialized);

    service.ngOnDestroy();
    expect(service.initializeCheckInterval).toBeFalsy();
    expect(service.state()).toEqual(MathJaxState.none);
  });

  it('Get render function maps correctly', () => {
    window.MathJax.asciimath2svg = 'AAAAA' as any;

    // Default service uses svg output loader
    expect(service.getRenderFunction()).toBe(MathJax.asciimath2svg);

    // Service with unknown output loader falls back to noop
    const injector = Injector.create({
      providers: [
        {
          provide: MathJaxConfig,
          useValue: {
            inputLoader: MathJaxInputLoaderEnum.asciimath,
            outputLoader: 'BBB' as any,
          },
        },
      ],
    });
    const service2 = runInInjectionContext(injector, () => new MathJaxService());
    expect(service2.getRenderFunction()).toBe(
      MathJaxService.NOOP_RENDER_FUNCTION
    );
  });

  it('noop render function returns span with original text', () => {
    expect(MathJaxService.NOOP_RENDER_FUNCTION('AAAAA').textContent).toEqual(
      'AAAAA'
    );
  });

  it('startPollInitialized but is immediately ready', () => {
    window.MathJax.typeset = (() => undefined) as any;

    service.startPollForInitialized();
    expect(service.state()).toEqual(MathJaxState.initialized);
  });
});
