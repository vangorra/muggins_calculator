import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatSelectModule} from "@angular/material/select";
import {ReactiveFormsModule} from "@angular/forms";
import {MatGridListModule} from "@angular/material/grid-list";
import {MatCardModule} from "@angular/material/card";
import {MatRadioModule} from "@angular/material/radio";
import {FlexLayoutModule} from "@angular/flex-layout";
import {NgxScrollTopModule} from "ngx-scrolltop";
import {MatButtonModule} from "@angular/material/button";
import {MatDividerModule} from "@angular/material/divider";
import {MatListModule} from "@angular/material/list";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatInputModule} from "@angular/material/input";
import {MatBottomSheetModule} from "@angular/material/bottom-sheet";
import {MatIconModule} from "@angular/material/icon";
import {getByText, render, screen} from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import AppComponent from "./app.component";
import DieComponent from "./die/die.component";
import ConfigComponent from "./config/config.component";
import CalculatorComponent from "./calculator/calculator.component";
import createSpy = jasmine.createSpy;

describe(CalculatorComponent.name, () => {
  const renderComponent = () => render(
    `<app-calculator></app-calculator>`,
    {
      declarations: [
        AppComponent,
        CalculatorComponent,
        DieComponent,
        ConfigComponent,
      ],
      imports: [
        MatCheckboxModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatGridListModule,
        MatCardModule,
        MatRadioModule,
        FlexLayoutModule,
        NgxScrollTopModule,
        MatButtonModule,
        MatDividerModule,
        MatListModule,
        MatProgressSpinnerModule,
        MatInputModule,
        MatBottomSheetModule,
        MatIconModule,
      ]
    }
  );

  it("Test it", async () => {
    const {container} = await renderComponent();

    const getDieFace = async (el: HTMLElement, face: number) => getByText(el, (content, element) => {
        if (!element || !(element instanceof HTMLInputElement)) {
          return false;
        }
        const inputEl = element as HTMLInputElement;
        return inputEl.tagName === "INPUT" && inputEl.type === "radio" && inputEl.value === `${face  }`;
      }) as HTMLInputElement;

    const getEquationElements = async () => screen.getAllByText((text, element) =>
        element?.tagName === "MAT-LIST-ITEM" && element?.classList.contains("equationStr")
      );

    // Test changing die faces.
    const faceRadioGroups = await screen.getAllByText((text, element) =>
      element?.tagName === "MAT-RADIO-GROUP" && element?.classList.contains("faceOptions")
    );
    const die1Face4 = await getDieFace(faceRadioGroups[0], 4);
    const die2Face3 = await getDieFace(faceRadioGroups[1], 3);
    const die3Face2 = await getDieFace(faceRadioGroups[2], 2);
    let equationElements: HTMLElement[];

    equationElements = await getEquationElements();
    expect(equationElements.length).toEqual(21);

    userEvent.click(die1Face4);
    equationElements = await getEquationElements();
    expect(equationElements.length).toEqual(59);
    expect(equationElements[0].textContent?.trim()).toEqual("2 = ((4 - 1) - 1)");

    userEvent.click(die2Face3);
    equationElements = await getEquationElements();
    expect(equationElements.length).toEqual(101);
    expect(equationElements[0].textContent?.trim()).toEqual("1 = ((1 + 3) / 4)");

    userEvent.click(die3Face2);
    equationElements = await getEquationElements();
    expect(equationElements.length).toEqual(99);
    expect(equationElements[0].textContent?.trim()).toEqual("1 = ((2 + 3) - 4)");

    const configButton = await screen.getByText((text, element) =>
      element?.tagName === "BUTTON" && element?.classList.contains("configButton")
    );
    userEvent.click(configButton);

    // Test config changes.
    const boardMinNumberEl = await screen.getByTestId("boardMinNumber") as HTMLInputElement;
    const boardMaxNumberEl = await screen.getByTestId("boardMaxNumber") as HTMLInputElement;
    const diceCountEl = await screen.getByTestId("diceCount") as HTMLInputElement;
    const customizeDieFaceCountEl = await screen.getByTestId("customizeDieFaceCount") as HTMLInputElement;

    userEvent.type(boardMinNumberEl, "{selectall}2");
    userEvent.type(boardMaxNumberEl, "{selectall}4");
    userEvent.type(diceCountEl, "{selectall}4");
    userEvent.click(customizeDieFaceCountEl);
    userEvent.click(container);

    equationElements = await getEquationElements();
    expect(equationElements.length).toEqual(1053);
    expect(equationElements[0].textContent?.trim()).toEqual("2 = (((1 + 2) + 3) - 4)");

    // Test select equation.
    expect(equationElements[0].classList.contains("active")).toBeFalse();
    userEvent.click(equationElements[0]);
    expect(equationElements[0].classList.contains("active")).toBeTrue();
    userEvent.click(equationElements[1]);
    expect(equationElements[0].classList.contains("active")).toBeFalse();
    expect(equationElements[1].classList.contains("active")).toBeTrue();
    userEvent.click(equationElements[1]);
    expect(equationElements[1].classList.contains("active")).toBeFalse();
    expect(equationElements[1].classList.contains("active")).toBeFalse();
  });

  it("Cancel Worker", async () => {
    class MockWorker {
      public readonly url: URL;

      public readonly importType: string;

      public onmessage!: ((this: Worker, ev: MessageEvent) => any);

      public readonly terminate = createSpy();

      cancelTimeout: any;

      constructor(url: URL, importType: string) {
        this.url = url;
        this.importType = importType;
      }

      public postMessage(): void {
        const self = this;
        self.cancelTimeout = setTimeout(
          // @ts-ignore
          () => self.onmessage.call(self, {
            data: {
              aaa: "111",
            },
          }),
          100
        );
      }
    }

    Object.defineProperty(window, 'Worker', {
      value: MockWorker,
    });

    await renderComponent();
    const cancelButton = await screen.getByTestId("cancelButton");
    userEvent.click(cancelButton);
    const reloadButton = await screen.getByTestId("reloadButton");
    expect(!!reloadButton).toBeTrue();
  });
});
