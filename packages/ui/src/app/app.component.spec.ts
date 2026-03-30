import AppComponent from './app.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MathJaxService, MathJaxState } from './math-jax/math-jax.service';
import { newMockMathJaxService } from './test-utils';

describe(AppComponent.name, () => {
  let fixture: ComponentFixture<AppComponent>;
  let element: HTMLElement;
  let component: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([
          { path: 'calculator', component: AppComponent },
          { path: '**', redirectTo: '/calculator' },
        ]),
        provideAnimations(),
        {
          provide: MathJaxService,
          useValue: newMockMathJaxService(MathJaxState.initialized),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    element = fixture.nativeElement;
    component = fixture.componentInstance;

    // Use a synchronous thenable so isFontsLoaded is set during the first CD cycle.
    Object.defineProperty(document, 'fonts', {
      value: {
        ready: {
          then: (cb: Function) => {
            cb();
            return Promise.resolve();
          },
        },
      },
      configurable: true,
    });
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have fonts loaded after init', () => {
    expect(component.isFontsLoaded).toBeTruthy();
  });

  it('should render toolbar when initialized', () => {
    expect(element.querySelector('app-toolbar')).toBeTruthy();
  });
});
