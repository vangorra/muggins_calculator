import ColorSchemeService, {ColorScheme, DEFAULT_COLOR_SCHEME} from "./color-scheme.service";


describe('ColorSchemeService', () => {
  it('Persistent changes', () => {
    const service = new ColorSchemeService();
    const mediaColorScheme = service.getMediaColorScheme() || DEFAULT_COLOR_SCHEME;

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
