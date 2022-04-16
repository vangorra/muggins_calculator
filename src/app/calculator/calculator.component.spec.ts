import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import DieComponent from '../die/die.component';
import CalculatorComponent from './calculator.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfigurationService } from '../configuration.service';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { DiceComponent } from '../dice/dice.component';
import { SolverWorkerService } from '../solver-worker.service';
import { OperationEnum } from '../solver/solver';
import { of } from 'rxjs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ToolbarButton, ToolbarService } from '../toolbar.service';
import { MathJaxModule } from '../math-jax/math-jax.module';
import { MathJaxState } from '../math-jax/math-jax.service';
import { mockMathJaxProvider } from '../test-utils';
import { AboutDialogComponent } from '../about-dialog/about-dialog.component';
import { ScrollToTopComponent } from '../scroll-to-top/scroll-to-top.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

describe(CalculatorComponent.name, () => {
  let component: CalculatorComponent;
  let fixture: ComponentFixture<CalculatorComponent>;
  let element: HTMLElement;
  let configurationService: ConfigurationService;
  let postMessageSpy: jest.Mock;
  let toolbarService: ToolbarService;

  beforeEach(async () => {
    postMessageSpy = jest.fn().mockReturnValue(
      of({
        data: [
          {
            total: 1,
            results: [
              {
                total: 1,
                equation: 'test data',
                fullEquation: '1 = test data',
                sortableEquation: 'test data',
              },
            ],
          },
        ],
      })
    );

    await TestBed.configureTestingModule({
      imports: [
        MathJaxModule.withConfig(),
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([]),
        MatDialogModule,
        MatCardModule,
        MatSelectModule,
        MatListModule,
        MatInputModule,
        NoopAnimationsModule,
        MatRadioModule,
        MatButtonToggleModule,
        MatProgressSpinnerModule,
      ],
      declarations: [
        CalculatorComponent,
        DiceComponent,
        DieComponent,
        ScrollToTopComponent,
      ],
      providers: [
        {
          provide: SolverWorkerService,
          useValue: {
            postMessage: postMessageSpy,
          },
        },
        mockMathJaxProvider(MathJaxState.initialized),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    configurationService = TestBed.inject(ConfigurationService);
    configurationService.resetToDefaults();
    configurationService.save();

    toolbarService = TestBed.inject(ToolbarService);

    fixture = TestBed.createComponent(CalculatorComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    fixture.detectChanges();
  });

  const selectDieFace = (index: number, face: number) => {
    const dieElement = Array.from(element.querySelectorAll('.dice app-die'))[
      index
    ] as HTMLElement;
    const faceElement = Array.from(
      dieElement.querySelectorAll('mat-button-toggle button')
    ).find((faceEl) => faceEl.textContent?.trim() === face + '') as HTMLElement;

    faceElement.dispatchEvent(new Event('click'));
    fixture.detectChanges();
  };

  const getEquationElements = () =>
    Array.from(
      element.querySelectorAll('.results .equations [appMathJax]')
    ) as HTMLElement[];

  const getEquations = () => {
    return getEquationElements().map((el) => el.textContent);
  };

  test('initial setup', () => {
    expect(component.dice).toEqual([
      { selectedFace: 1, faceCount: 6 },
      { selectedFace: 1, faceCount: 6 },
      { selectedFace: 1, faceCount: 6 },
    ]);
    expect(postMessageSpy).toHaveBeenCalledWith({
      operations: [
        OperationEnum.PLUS,
        OperationEnum.MINUS,
        OperationEnum.MULTIPLY,
        OperationEnum.DIVIDE,
      ],
      minTotal: 1,
      maxTotal: 36,
      faces: [1, 1, 1],
    });
    expect(getEquations()).toEqual(['RENDERED 1 = test data RENDERED']);
  });

  test('select die faces', () => {
    // Select die 1 face
    postMessageSpy.mockClear();
    selectDieFace(0, 2);
    fixture.detectChanges();
    expect(postMessageSpy).toHaveBeenCalledWith({
      operations: [
        OperationEnum.PLUS,
        OperationEnum.MINUS,
        OperationEnum.MULTIPLY,
        OperationEnum.DIVIDE,
      ],
      minTotal: 1,
      maxTotal: 36,
      faces: [2, 1, 1],
    });
    expect(getEquations()).toEqual(['RENDERED 1 = test data RENDERED']);

    // Select die 2 face
    postMessageSpy.mockClear();
    selectDieFace(1, 3);
    fixture.detectChanges();
    expect(postMessageSpy).toHaveBeenCalledWith({
      operations: [
        OperationEnum.PLUS,
        OperationEnum.MINUS,
        OperationEnum.MULTIPLY,
        OperationEnum.DIVIDE,
      ],
      minTotal: 1,
      maxTotal: 36,
      faces: [2, 3, 1],
    });
    expect(getEquations()).toEqual(['RENDERED 1 = test data RENDERED']);

    // Select die 3 face
    postMessageSpy.mockClear();
    selectDieFace(2, 4);
    fixture.detectChanges();
    expect(postMessageSpy).toHaveBeenCalledWith({
      operations: [
        OperationEnum.PLUS,
        OperationEnum.MINUS,
        OperationEnum.MULTIPLY,
        OperationEnum.DIVIDE,
      ],
      minTotal: 1,
      maxTotal: 36,
      faces: [2, 3, 4],
    });
    expect(getEquations()).toEqual(['RENDERED 1 = test data RENDERED']);
  });

  test('loading', () => {
    postMessageSpy.mockReturnValue(of({}));

    selectDieFace(0, 2);
    fixture.detectChanges();
    expect(postMessageSpy).toHaveBeenCalledWith({
      operations: [
        OperationEnum.PLUS,
        OperationEnum.MINUS,
        OperationEnum.MULTIPLY,
        OperationEnum.DIVIDE,
      ],
      minTotal: 1,
      maxTotal: 36,
      faces: [2, 1, 1],
    });
    expect(
      element.querySelector('.results mat-card-content.loading')
    ).toBeTruthy();
    expect(element.querySelector('.results mat-card-content.none')).toBeFalsy();
    expect(element.querySelector('.results mat-card-content.data')).toBeFalsy();
  });

  test('no results', () => {
    postMessageSpy.mockReturnValue(
      of({
        data: [],
      })
    );

    selectDieFace(0, 2);
    fixture.detectChanges();
    expect(postMessageSpy).toHaveBeenCalledWith({
      operations: [
        OperationEnum.PLUS,
        OperationEnum.MINUS,
        OperationEnum.MULTIPLY,
        OperationEnum.DIVIDE,
      ],
      minTotal: 1,
      maxTotal: 36,
      faces: [2, 1, 1],
    });
    expect(
      element.querySelector('.results mat-card-content.loading')
    ).toBeFalsy();
    expect(
      element.querySelector('.results mat-card-content.none')
    ).toBeTruthy();
    expect(element.querySelector('.results mat-card-content.data')).toBeFalsy();
  });

  test('select equation', () => {
    expect(
      element.querySelector('.results .mat-list-single-selected-option')
    ).toBeFalsy();
    getEquationElements()[0].click();
    fixture.detectChanges();
    expect(
      element.querySelector('.results .mat-list-single-selected-option')
    ).toBeTruthy();
  });

  test('scroll to id', () => {
    const jumpButton = element.querySelector(
      '.results .jumpButtonWrapper button'
    ) as HTMLButtonElement;
    const targetId = component.groupId(jumpButton.textContent?.trim() + '');
    const targetElement = document.getElementById(targetId) as HTMLElement;
    const scrollIntoViewSpy = jest.fn();
    targetElement.scrollIntoView = scrollIntoViewSpy;

    jumpButton.click();
    expect(scrollIntoViewSpy).toHaveBeenCalled();
  });

  test('open about dialog', () => {
    const openSpy = jest.spyOn(component.matDialog, 'open');
    const button = toolbarService.config
      .getValue()
      .buttons.find(
        (toolbarButton) => toolbarButton.title === 'About'
      ) as ToolbarButton;
    expect(button).toBeTruthy();
    button.onClick();
    expect(openSpy).toHaveBeenCalledWith(AboutDialogComponent, {});
  });

  test('destroy', () => {
    fixture.destroy();
    expect(component.configurationSubscription?.closed).toBeTruthy();
  });
});
