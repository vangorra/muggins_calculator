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
import {render, screen} from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import DieComponent from "../die/die.component";
import ConfigComponent from "../config/config.component";
import CalculatorComponent from "../calculator/calculator.component";
import AppRoutingModule from "../app-routing.module";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import createSpy = jasmine.createSpy;

describe(CalculatorComponent.name, () => {
  const renderComponent = () => render(
    `<app-calculator></app-calculator>`,
    {
      declarations: [
        // AppComponent,
        CalculatorComponent,
        DieComponent,
        ConfigComponent,
      ],
      imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
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
      ],
    }
  );

  let originalWorkerClass: any;
  beforeAll(() => {
    originalWorkerClass = window.Worker;
  });

  afterEach(() => {
    Object.defineProperty(window, 'Worker', {
      value: originalWorkerClass,
    });
  });

  it("Full run through", async() => {
    const {container} = await renderComponent();
    const containerParent = container.parentElement as HTMLElement;
    expect(containerParent).toBeTruthy();

    const getDieFace = (el: HTMLElement, face: number) => el.querySelector(`input[type='radio'][value='${face}']`) as HTMLElement;
    const getEquationElements = () => Array.from(container.querySelectorAll("mat-list-item.equationStr")) as HTMLElement[];

    // Test changing die faces.
    const faceRadioGroups = Array.from(container.querySelectorAll("mat-radio-group")) as HTMLElement[];
    expect(faceRadioGroups).toBeTruthy();
    expect(faceRadioGroups.length).toEqual(3);

    const die1Face4 = getDieFace(faceRadioGroups[0], 4);
    expect(die1Face4).toBeTruthy();
    const die2Face3 = getDieFace(faceRadioGroups[1], 3);
    expect(die2Face3).toBeTruthy();
    const die3Face2 = getDieFace(faceRadioGroups[2], 2);
    expect(die3Face2).toBeTruthy();
    let equationElements: HTMLElement[];

    equationElements = getEquationElements();
    expect(equationElements.length).toEqual(21);

    userEvent.click(die1Face4);
    equationElements = getEquationElements();
    expect(equationElements.length).toEqual(74);
    expect(equationElements[0].textContent?.trim()).toEqual("2 = ((4 - 1) - 1)");

    userEvent.click(die2Face3);
    equationElements = getEquationElements();
    expect(equationElements.length).toEqual(140);
    expect(equationElements[0].textContent?.trim()).toEqual("1 = ((1 x 4) - 3)");

    userEvent.click(die3Face2);
    equationElements = getEquationElements();
    expect(equationElements.length).toEqual(156);
    expect(equationElements[0].textContent?.trim()).toEqual("1 = ((2 + 3) - 4)");

    const configButton = container.querySelector("button.configButton") as HTMLElement;
    expect(configButton).toBeTruthy();
    userEvent.click(configButton);

    // Test config changes.
    const operationsEl = containerParent.querySelector("[data-testid='operations']") as HTMLInputElement;
    const boardMinNumberEl = containerParent.querySelector("[data-testid='boardMinNumber']") as HTMLInputElement;
    const boardMaxNumberEl = containerParent.querySelector("[data-testid='boardMaxNumber']") as HTMLInputElement;
    const diceCountEl = containerParent.querySelector("[data-testid='diceCount']") as HTMLInputElement;
    const customizeDieFaceCountEl = containerParent.querySelector("[data-testid='customizeDieFaceCount']") as HTMLInputElement;
    expect(operationsEl).toBeTruthy();
    expect(boardMinNumberEl).toBeTruthy();
    expect(boardMaxNumberEl).toBeTruthy();
    expect(diceCountEl).toBeTruthy();
    expect(customizeDieFaceCountEl).toBeTruthy();

    userEvent.type(boardMinNumberEl, "{selectall}2");
    userEvent.type(boardMaxNumberEl, "{selectall}4");
    userEvent.type(diceCountEl, "{selectall}4");
    userEvent.click(customizeDieFaceCountEl);
    userEvent.click(container);

    equationElements = await getEquationElements();
    expect(equationElements.length).toEqual(2054);
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
