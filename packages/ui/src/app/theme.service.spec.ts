import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';
import { ConfigurationService } from './configuration.service';
import { ThemeEnum } from './general_types';

/**
 * Creates a mock for window.matchMedia that allows controlling which
 * media query matches and triggering change event listeners.
 */
function createMatchMediaMock() {
  const queryStates = new Map<
    string,
    {
      matches: boolean;
      listeners: Set<Function>;
    }
  >();

  function getOrCreate(query: string) {
    if (!queryStates.has(query)) {
      queryStates.set(query, { matches: false, listeners: new Set() });
    }
    return queryStates.get(query)!;
  }

  const matchMediaFn = (query: string): MediaQueryList => {
    const state = getOrCreate(query);
    return {
      get matches() {
        return state.matches;
      },
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_event: string, cb: Function) => {
        state.listeners.add(cb);
      },
      removeEventListener: (_event: string, cb: Function) => {
        state.listeners.delete(cb);
      },
      dispatchEvent: () => true,
    } as MediaQueryList;
  };

  return {
    matchMediaFn,
    set: (matchingQuery: string) => {
      for (const [query, state] of queryStates) {
        state.matches = query === matchingQuery;
      }
      for (const state of queryStates.values()) {
        for (const listener of state.listeners) {
          listener();
        }
      }
    },
    reset: () => {
      for (const state of queryStates.values()) {
        state.matches = false;
        state.listeners.clear();
      }
      queryStates.clear();
    },
    getListenerCount: (query: string) => {
      return queryStates.get(query)?.listeners.size ?? 0;
    },
  };
}

describe(ThemeService.name, () => {
  let configurationService: ConfigurationService;
  let themeService: ThemeService;
  let mockMedia: ReturnType<typeof createMatchMediaMock>;

  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    mockMedia = createMatchMediaMock();
    originalMatchMedia = window.matchMedia;
    window.matchMedia = mockMedia.matchMediaFn as any;

    TestBed.configureTestingModule({});
    configurationService = TestBed.inject(ConfigurationService);
    themeService = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.body.className = '';
  });

  const expectTheme = (theme: ThemeEnum) => {
    expect(
      document.body.classList.contains(ThemeService.newColorSchemeClass(theme))
    ).toBeTruthy();
  };

  const expectNotTheme = (theme: ThemeEnum) => {
    expect(
      document.body.classList.contains(ThemeService.newColorSchemeClass(theme))
    ).toBeFalsy();
  };

  describe('when config is automatic, change theme from browser', () => {
    beforeEach(() => {
      configurationService.update({
        theme: ThemeEnum.AUTOMATIC,
      });
      TestBed.flushEffects();
    });

    const testFromTo = (
      fromMedia: string,
      toMedia: string,
      fromTheme: ThemeEnum,
      toTheme: ThemeEnum
    ) => {
      it(`from ${fromTheme} to ${toTheme}`, () => {
        mockMedia.set(fromMedia);
        expectTheme(fromTheme);
        expectNotTheme(toTheme);

        mockMedia.set(toMedia);
        expectTheme(toTheme);
        expectNotTheme(fromTheme);
      });
    };

    testFromTo(
      ThemeService.PREFERS_DARK_COLOR_SCHEME_MEDIA_QUERY,
      ThemeService.PREFERS_COLOR_SCHEME_MEDIA_QUERY,
      ThemeEnum.DARK,
      ThemeEnum.LIGHT
    );

    testFromTo(
      ThemeService.PREFERS_COLOR_SCHEME_MEDIA_QUERY,
      ThemeService.PREFERS_DARK_COLOR_SCHEME_MEDIA_QUERY,
      ThemeEnum.LIGHT,
      ThemeEnum.DARK
    );
  });

  describe('change theme from browser will not apply when', () => {
    const testFromTo = (
      config: ThemeEnum,
      notMedia: string,
      notTheme: ThemeEnum
    ) => {
      it(`config is ${config}`, () => {
        configurationService.update({
          theme: config,
        });
        TestBed.flushEffects();

        mockMedia.set(notMedia);
        expectNotTheme(notTheme);
      });
    };

    testFromTo(
      ThemeEnum.DARK,
      ThemeService.PREFERS_COLOR_SCHEME_MEDIA_QUERY,
      ThemeEnum.LIGHT
    );

    testFromTo(
      ThemeEnum.LIGHT,
      ThemeService.PREFERS_DARK_COLOR_SCHEME_MEDIA_QUERY,
      ThemeEnum.DARK
    );
  });

  describe('change theme through configuration', () => {
    const testFromTo = (fromTheme: ThemeEnum, toTheme: ThemeEnum) => {
      it(`to ${toTheme} always changes`, () => {
        configurationService.update({
          theme: fromTheme,
        });
        TestBed.flushEffects();
        expectTheme(fromTheme);

        configurationService.update({
          theme: toTheme,
        });
        TestBed.flushEffects();
        expectTheme(toTheme);
      });
    };

    testFromTo(ThemeEnum.DARK, ThemeEnum.LIGHT);

    testFromTo(ThemeEnum.LIGHT, ThemeEnum.DARK);

    it('automatic adopts media', () => {
      mockMedia.set(ThemeService.PREFERS_COLOR_SCHEME_MEDIA_QUERY);
      configurationService.update({
        theme: ThemeEnum.AUTOMATIC,
      });
      TestBed.flushEffects();
      expectTheme(ThemeEnum.LIGHT);

      mockMedia.set(ThemeService.PREFERS_DARK_COLOR_SCHEME_MEDIA_QUERY);
      expectTheme(ThemeEnum.DARK);

      mockMedia.set(ThemeService.PREFERS_COLOR_SCHEME_MEDIA_QUERY);
      expectTheme(ThemeEnum.LIGHT);
    });
  });

  it(ThemeService.prototype.ngOnDestroy.name, () => {
    const removeEventListenerSpy = vi.spyOn(
      themeService.mediaQuery,
      'removeEventListener'
    );
    themeService.ngOnDestroy();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      ThemeService.MEDIA_EVENT,
      themeService.mediaChangeListener
    );
  });
});
