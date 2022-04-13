import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';
import { ConfigurationService } from './configuration.service';
import { ThemeEnum } from './general_types';
import { expect } from '@angular/flex-layout/_private-utils/testing';

describe('ThemeServiceService', () => {
  let configurationService: ConfigurationService;
  let themeService: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    configurationService = TestBed.inject(ConfigurationService);
    themeService = TestBed.inject(ThemeService);
  });

  it('dark mode detected on startup', () => {
    spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
    } as any);

    expect(themeService.getMediaColorScheme(ThemeEnum.LIGHT)).toEqual(
      ThemeEnum.DARK
    );
  });

  it('user changes browser to light color profile', () => {
    configurationService.update({
      theme: ThemeEnum.AUTOMATIC,
    });

    spyOn(window, 'matchMedia').and.returnValue({
      matches: false,
    } as any);

    themeService.mediaChangeListener();

    expect(
      document.body.classList.contains(
        ThemeService.newColorSchemeClass(ThemeEnum.LIGHT)
      )
    ).toBeTrue();
  });

  it('user changes browser to dark color profile', () => {
    configurationService.update({
      theme: ThemeEnum.AUTOMATIC,
    });

    spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
    } as any);

    themeService.mediaChangeListener();

    expect(
      document.body.classList.contains(
        ThemeService.newColorSchemeClass(ThemeEnum.DARK)
      )
    ).toBeTrue();
  });

  it('change theme', () => {
    expect(configurationService.value.observed).toBe(true);
    // @ts-ignore
    expect(
      (themeService.mediaQuery as any).eventListeners(ThemeService.MEDIA_EVENT)
        .length
    ).toBe(1);
    expect(
      document.body.classList.contains(
        ThemeService.newColorSchemeClass(ThemeEnum.LIGHT)
      )
    ).toBeTrue();

    // Change the theme to dark.
    configurationService.update({
      theme: ThemeEnum.DARK,
    });
    expect(
      document.body.classList.contains(
        ThemeService.newColorSchemeClass(ThemeEnum.DARK)
      )
    ).toBeTrue();

    // Change the theme to auto.
    configurationService.update({
      theme: ThemeEnum.LIGHT,
    });
    expect(
      document.body.classList.contains(
        ThemeService.newColorSchemeClass(ThemeEnum.LIGHT)
      )
    ).toBeTrue();

    themeService.ngOnDestroy();
    expect(configurationService.value.observed).toBe(false);
    // @ts-ignore
    expect(
      (themeService.mediaQuery as any).eventListeners(ThemeService.MEDIA_EVENT)
        .length
    ).toBe(0);
  });
});
