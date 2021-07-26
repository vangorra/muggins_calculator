import ColorSchemeService, {
  ColorScheme,
  DEFAULT_COLOR_SCHEME,
} from './color-scheme.service';

describe('ColorSchemeService', () => {
  it('Media is handled properly', () => {
    class MockMediaQueryList {
      /* eslint-disable class-methods-use-this */
      addEventListener() {}

      /* eslint-disable class-methods-use-this */
      removeEventListener() {}

      get matches(): boolean {
        return true;
      }
    }
    const thing = new MockMediaQueryList() as any as MediaQueryList;
    const addEventListenerSpy = spyOn(thing, 'addEventListener');
    const removeEventListenerSpy = spyOn(thing, 'removeEventListener');
    const matchesSpy = spyOnProperty(thing, 'matches');

    const matchMediaSpy = spyOn(window, 'matchMedia');
    matchMediaSpy.and.returnValue(thing);

    const service = new ColorSchemeService();
    expect(addEventListenerSpy).not.toHaveBeenCalled();
    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    service.subscribeToMediaChanges();
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'change',
      service.mediaChangeListener
    );
    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    addEventListenerSpy.calls.reset();
    service.unsubscribeFromMediaChanges();
    expect(addEventListenerSpy).not.toHaveBeenCalled();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'change',
      service.mediaChangeListener
    );

    const applyStyleSpy = spyOn(service, 'applyStyle');
    service.mediaChangeListener();
    expect(applyStyleSpy).toHaveBeenCalled();

    matchesSpy.and.returnValue(true);
    expect(service.getMediaColorScheme()).toEqual(ColorScheme.DARK);
    matchesSpy.and.returnValue(false);
    expect(service.getMediaColorScheme()).toBeUndefined();
  });

  it('Persistent changes', () => {
    const service = new ColorSchemeService();
    const mediaColorScheme =
      service.getMediaColorScheme() || DEFAULT_COLOR_SCHEME;

    expect(service.getCalculatedColorScheme()).toEqual(mediaColorScheme);
    expect(service.getPersistentColorScheme()).toBeUndefined();

    service.setPersistentColorScheme(ColorScheme.DARK);
    expect(service.getPersistentColorScheme()).toEqual(ColorScheme.DARK);
    expect(service.getCalculatedColorScheme()).toEqual(ColorScheme.DARK);

    service.setPersistentColorScheme(ColorScheme.LIGHT);
    expect(service.getPersistentColorScheme()).toEqual(ColorScheme.LIGHT);
    expect(service.getCalculatedColorScheme()).toEqual(ColorScheme.LIGHT);

    service.clearPersistentColorScheme();
    expect(service.getPersistentColorScheme()).toBeUndefined();
    expect(service.getCalculatedColorScheme()).toEqual(mediaColorScheme);
  });
});
