import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';
import { ConfigurationService } from './configuration.service';
import { ThemeEnum } from './general_types';

describe(ThemeService.name, () => {
  let configurationService: ConfigurationService;
  let themeService: ThemeService;

  beforeEach(() => {
    window.mockMatchMediaManager.reset();

    TestBed.configureTestingModule({});
    configurationService = TestBed.inject(ConfigurationService);
    themeService = TestBed.inject(ThemeService);
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
    });

    const testFromTo = (
      fromMedia: string,
      toMedia: string,
      fromTheme: ThemeEnum,
      toTheme: ThemeEnum
    ) => {
      test(`from ${fromTheme} to ${toTheme}`, () => {
        window.mockMatchMediaManager.set(fromMedia, ThemeService.MEDIA_EVENT);
        expectTheme(fromTheme);
        expectNotTheme(toTheme);

        window.mockMatchMediaManager.set(toMedia, ThemeService.MEDIA_EVENT);
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
      test(`config is ${config}`, () => {
        configurationService.update({
          theme: config,
        });

        window.mockMatchMediaManager.set(notMedia, ThemeService.MEDIA_EVENT);
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
      test(`to ${toTheme} always changes`, () => {
        configurationService.update({
          theme: fromTheme,
        });
        expectTheme(fromTheme);

        configurationService.update({
          theme: toTheme,
        });
        expectTheme(toTheme);
      });
    };

    testFromTo(ThemeEnum.DARK, ThemeEnum.LIGHT);

    testFromTo(ThemeEnum.LIGHT, ThemeEnum.DARK);

    test('automatic adopts media', () => {
      window.mockMatchMediaManager.set(
        ThemeService.PREFERS_COLOR_SCHEME_MEDIA_QUERY,
        ThemeService.MEDIA_EVENT
      );
      configurationService.update({
        theme: ThemeEnum.AUTOMATIC,
      });
      expectTheme(ThemeEnum.LIGHT);

      window.mockMatchMediaManager.set(
        ThemeService.PREFERS_DARK_COLOR_SCHEME_MEDIA_QUERY,
        ThemeService.MEDIA_EVENT
      );
      expectTheme(ThemeEnum.DARK);

      window.mockMatchMediaManager.set(
        ThemeService.PREFERS_COLOR_SCHEME_MEDIA_QUERY,
        ThemeService.MEDIA_EVENT
      );
      expectTheme(ThemeEnum.LIGHT);
    });
  });

  test(ThemeService.prototype.ngOnDestroy.name, () => {
    expect(themeService.configurationSubscription.closed).toBeFalsy();
    const unsubscribeSpy = jest.spyOn(
      themeService.configurationSubscription,
      'unsubscribe'
    );
    themeService.ngOnDestroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
    expect((themeService.mediaQuery as any).eventListeners()).toEqual([]);
  });
});
