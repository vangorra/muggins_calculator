import { Injectable } from '@angular/core';
import { ConfigurationService } from './configuration.service';
import { Configuration, ThemeEnum, ThemeType } from './general_types';
import { Subscription } from 'rxjs';
import { DEFAULT_CONFIGURATION } from './const';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly mediaQuery: MediaQueryList = window.matchMedia(
    '(prefers-color-scheme)'
  );

  readonly applyStyleFromConfiguration = (configuration: Configuration) =>
    this.applyStyle(configuration.theme);

  readonly mediaChangeListener = () =>
    this.applyStyleFromConfiguration(
      this.configurationService.value.getValue()
    );

  private configurationSubscription?: Subscription;

  private readonly configurationService: ConfigurationService;

  constructor(configurationService: ConfigurationService) {
    this.configurationService = configurationService;
  }

  public start() {
    // Listen for configuration changes and apply the style.
    this.configurationSubscription = this.configurationService.value.subscribe(
      this.applyStyleFromConfiguration
    );

    // Listen for change to the preferred color scheme and apply the style from configuration.
    this.mediaQuery.addEventListener('change', this.mediaChangeListener);
  }

  public stop() {
    // Stop listening for config changes.
    this.configurationSubscription?.unsubscribe();

    // Stop listening for preferred color scheme changes.
    this.mediaQuery.removeEventListener('change', this.mediaChangeListener);
  }

  /**
   * Apply the current color preference css style to the body tag.
   */
  public applyStyle(theme: ThemeType): void {
    let selectedTheme: ThemeType = theme;

    // Derive based on browser media data.
    if (theme === ThemeEnum.AUTOMATIC) {
      selectedTheme = this.getMediaColorScheme(DEFAULT_CONFIGURATION.theme);
    }

    const currentColorSchemeClassName =
      ThemeService.newColorSchemeClass(selectedTheme);

    const { classList } = document.body;

    // Remove existing scheme classes.
    const removeClassNames = Object.values(ThemeEnum)
      .map((themeValue) => ThemeService.newColorSchemeClass(themeValue))
      // Exclude the currently selected scheme.
      .filter((className) => className !== currentColorSchemeClassName);

    classList.remove(...removeClassNames);
    classList.add(currentColorSchemeClassName);
  }

  /**
   * Get color scheme dictated by a media query.
   * @private
   */
  public getMediaColorScheme(defaultValue: ThemeType): ThemeType {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return ThemeEnum.DARK;
    }

    return defaultValue;
  }

  /**
   * Create a class name for a color scheme.
   * @param colorScheme
   * @private
   */
  private static newColorSchemeClass(colorScheme: ThemeType): string {
    return `color-scheme-${colorScheme.valueOf()}`;
  }
}
