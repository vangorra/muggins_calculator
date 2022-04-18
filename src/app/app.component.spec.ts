import AppComponent from './app.component';
import CalculatorComponent from './calculator/calculator.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolverWorkerService } from './solver-worker.service';
import { BehaviorSubject } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ConfigurationComponent } from './configuration/configuration.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { SolverWorkerResponse } from './solver/utils';
import { MatIconModule } from '@angular/material/icon';
import { MathJaxService, MathJaxState } from './math-jax/math-jax.service';
import { routes } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatGridListModule } from '@angular/material/grid-list';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { newMockMathJaxService } from './test-utils';
import { ScrollToTopComponent } from './scroll-to-top/scroll-to-top.component';
import { DiceComponent } from './dice/dice.component';
import DieComponent from './die/die.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe(AppComponent.name, () => {
  let fixture: ComponentFixture<AppComponent>;
  let element: HTMLElement;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        RouterTestingModule.withRoutes(routes, { useHash: false }),
        NoopAnimationsModule,
        MatCheckboxModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatGridListModule,
        MatCardModule,
        MatRadioModule,
        FlexLayoutModule,
        MatButtonModule,
        MatDividerModule,
        MatListModule,
        MatProgressSpinnerModule,
        MatInputModule,
        MatButtonToggleModule,
        MatIconModule,
        MatToolbarModule,
        MatDialogModule,
        MatSnackBarModule,
      ],
      declarations: [
        AppComponent,
        CalculatorComponent,
        ConfigurationComponent,
        ToolbarComponent,
        ScrollToTopComponent,
        DiceComponent,
        DieComponent,
      ],
      providers: [
        {
          provide: SolverWorkerService,
          useValue: {
            postMessage: () =>
              new BehaviorSubject<SolverWorkerResponse>({
                data: [],
              }),
          },
        },
        {
          provide: MathJaxService,
          useValue: newMockMathJaxService(MathJaxState.initialized),
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    element = fixture.nativeElement;
    router = TestBed.inject(Router);

    fixture.detectChanges();
  });

  test('routes work', async () => {
    await router.navigate(['/']);
    fixture.detectChanges();

    const toolbarElement = element.querySelector('mat-toolbar') as HTMLElement;

    expect(
      toolbarElement.querySelector('.configTitle')?.textContent?.trim()
    ).toEqual('Muggins Calculator');
    expect(element.querySelector('app-calculator')).toBeTruthy();
    const configurationButton = toolbarElement.querySelector(
      'button[title="Configuration"]'
    ) as HTMLButtonElement;
    configurationButton.click();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      toolbarElement.querySelector('.configTitle')?.textContent?.trim()
    ).toEqual('Configuration');
    expect(element.querySelector('app-configuration')).toBeTruthy();
    const closeButton = toolbarElement.querySelector(
      'button[title="Close"]'
    ) as HTMLButtonElement;
    closeButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('app-calculator')).toBeTruthy();
  });
});
