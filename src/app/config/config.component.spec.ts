import ConfigComponent from "./config.component";

describe(ConfigComponent.name, () => {
  it("inputSelectAll", () => {
    const component = new ConfigComponent();
    component.inputSelectAll(undefined);
    component.inputSelectAll(document.createElement("div"));

    const input = document.createElement("input");
    const selectSpyOn = spyOn(input, "select");
    input.type = "text";
    input.value = "Text";
    component.inputSelectAll(input);
    expect(selectSpyOn).toHaveBeenCalled();
  });
});
