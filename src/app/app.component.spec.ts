import AppComponent from "./app.component";
import ColorSchemeService from "./color-scheme.service";

describe(AppComponent.name, () => {
  it("Initialize", () => {
    const colorSchemeService = new ColorSchemeService();
    const subscribeToMediaChangesSpy = spyOn(colorSchemeService, "subscribeToMediaChanges");
    const applyStyleSpy = spyOn(colorSchemeService, "applyStyle");
    /* eslint-disable no-new */
    new AppComponent(colorSchemeService);

    expect(subscribeToMediaChangesSpy).toHaveBeenCalled();
    expect(applyStyleSpy).toHaveBeenCalled();
  });
});
