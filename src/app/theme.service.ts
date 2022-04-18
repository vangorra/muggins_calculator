import { Injectable, OnDestroy } from '@angular/core';
import { ConfigurationService } from './configuration.service';
import { Configuration, ThemeEnum } from './general_types';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService implements OnDestroy {
  private static readonly CLASS_NAME_PREFIX = 'color-scheme-';

  static readonly PREFERS_DARK_COLOR_SCHEME_MEDIA_QUERY =
    '(prefers-color-scheme: dark)';

  static readonly PREFERS_COLOR_SCHEME_MEDIA_QUERY = '(prefers-color-scheme)';

  static readonly MEDIA_EVENT = 'change';

  readonly mediaQuery: MediaQueryList = window.matchMedia(
    ThemeService.PREFERS_COLOR_SCHEME_MEDIA_QUERY
  );

  readonly applyStyleFromConfiguration = (configuration: Configuration) =>
    this.applyStyle(configuration.theme);

  readonly mediaChangeListener = () =>
    this.applyStyleFromConfiguration(
      this.configurationService.value.getValue()
    );

  readonly configurationSubscription: Subscription;

  constructor(private readonly configurationService: ConfigurationService) {
    // Listen for configuration changes and apply the style.
    this.configurationSubscription = this.configurationService.value.subscribe(
      this.applyStyleFromConfiguration
    );

    // Listen for change to the preferred color scheme and apply the style from configuration.
    this.mediaQuery.addEventListener(
      ThemeService.MEDIA_EVENT,
      this.mediaChangeListener
    );
  }

  ngOnDestroy(): void {
    // Stop listening for config changes.
    this.configurationSubscription.unsubscribe();

    // Stop listening for preferred color scheme changes.
    this.mediaQuery.removeEventListener(
      ThemeService.MEDIA_EVENT,
      this.mediaChangeListener
    );
  }

  /**
   * Apply the current color preference css style to the body tag.
   */
  public applyStyle(theme: ThemeEnum): void {
    let selectedTheme: ThemeEnum = theme;

    // Derive based on browser media data.
    if (theme === ThemeEnum.AUTOMATIC) {
      selectedTheme = this.getMediaColorScheme();
    }

    const currentColorSchemeClassName =
      ThemeService.newColorSchemeClass(selectedTheme);

    const { classList } = document.body;

    // Remove existing scheme classes.
    const removeClassNames: string[] = [];
    classList.forEach((className) => {
      if (
        className.startsWith(ThemeService.CLASS_NAME_PREFIX) &&
        className !== currentColorSchemeClassName
      ) {
        removeClassNames.push(className);
      }
    });

    classList.remove(...removeClassNames);
    classList.add(currentColorSchemeClassName);
  }

  /**
   * Get color scheme dictated by a media query.
   * @private
   */
  public getMediaColorScheme(): ThemeEnum {
    if (
      window.matchMedia(ThemeService.PREFERS_DARK_COLOR_SCHEME_MEDIA_QUERY)
        .matches
    ) {
      return ThemeEnum.DARK;
    }

    return ThemeEnum.LIGHT;
  }

  /**
   * Create a class name for a color scheme.
   * @param colorScheme
   * @private
   */
  static newColorSchemeClass(colorScheme: ThemeEnum): string {
    return ThemeService.CLASS_NAME_PREFIX + colorScheme;
  }
}
