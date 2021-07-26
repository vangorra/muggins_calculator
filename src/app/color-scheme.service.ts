import { Injectable } from '@angular/core';

export enum ColorScheme {
  LIGHT = 'light',
  DARK = 'dark',
}

export const DEFAULT_COLOR_SCHEME = ColorScheme.LIGHT;
const LOCAL_STORAGE_COLOR_SCHEME_KEY = 'preferred-color-scheme';

/**
 * Service for manging the light/dark theme. See styles.scss for details of the themes.
 */
@Injectable({
  providedIn: 'root',
})
class ColorSchemeService {
  private readonly mediaQuery: MediaQueryList = window.matchMedia(
    '(prefers-color-scheme)'
  );

  readonly mediaChangeListener = () => this.applyStyle();

  /**
   * Listens for changes to color scheme preference and applies the change.
   */
  public subscribeToMediaChanges(): void {
    this.mediaQuery.addEventListener('change', this.mediaChangeListener);
  }

  /**
   * Stop listening for changes to the color change preference.
   */
  public unsubscribeFromMediaChanges(): void {
    this.mediaQuery.removeEventListener('change', this.mediaChangeListener);
  }

  /**
   * Apply the current color preference css style to the body tag.
   */
  public applyStyle(): void {
    const currentColorSchemeClassName = this.newColorSchemeClass(
      this.getCalculatedColorScheme()
    );

    const { classList } = document.body;

    // Remove existing scheme classes.
    const removeClassNames = Object.values(ColorScheme)
      .map((colorScheme) => this.newColorSchemeClass(colorScheme))
      // Exclude the currently selected scheme.
      .filter((className) => className !== currentColorSchemeClassName);

    classList.remove(...removeClassNames);
    classList.add(currentColorSchemeClassName);
  }

  /**
   * Get the color scheme persisted in local storage.
   */
  public getPersistentColorScheme(): ColorScheme | undefined {
    return this.getLocalStorageColorScheme();
  }

  /**
   * Persist a new color scheme in local storage.
   * @param scheme
   */
  public setPersistentColorScheme(scheme: ColorScheme): void {
    localStorage.setItem(LOCAL_STORAGE_COLOR_SCHEME_KEY, scheme.valueOf());
    this.applyStyle();
  }

  /**
   * Clear the current color scheme from local storage.
   */
  public clearPersistentColorScheme(): void {
    localStorage.removeItem(LOCAL_STORAGE_COLOR_SCHEME_KEY);
    this.applyStyle();
  }

  /**
   * Determine the current user color scheme preference. Pulls from local storage, media in order.
   * Defaults to light.
   */
  public getCalculatedColorScheme(): ColorScheme {
    return (
      this.getLocalStorageColorScheme() ||
      this.getMediaColorScheme() ||
      DEFAULT_COLOR_SCHEME
    );
  }

  /**
   * Get color scheme dictated by a media query.
   * @private
   */
  /* eslint-disable class-methods-use-this */
  public getMediaColorScheme(): ColorScheme | undefined {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return ColorScheme.DARK;
    }

    return undefined;
  }

  /**
   * Get color scheme dictated by local storage preference.
   * @private
   */
  private getLocalStorageColorScheme(): ColorScheme | undefined {
    const savedPref = localStorage.getItem(LOCAL_STORAGE_COLOR_SCHEME_KEY);

    return Object.entries(ColorScheme)
      .filter(([, value]) => value === savedPref)
      .map(([, value]) => value)
      .pop();
  }

  /**
   * Create a class name for a color scheme.
   * @param colorScheme
   * @private
   */
  private newColorSchemeClass(colorScheme: ColorScheme): string {
    return `color-scheme-${colorScheme.valueOf()}`;
  }
}

export default ColorSchemeService;
