import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import AppComponent from './app/app.component';
import { SolverOrchestrator } from './app/solver/solver-orchestrator';
import {
  MathJaxConfig,
  MathJaxInputLoaderEnum,
  MathJaxOutputLoaderEnum,
} from './app/math-jax/utils';

const routes = [
  {
    path: 'calculator',
    loadComponent: () =>
      import('./app/calculator/calculator.component').then((m) => m.default),
  },
  {
    path: 'configuration',
    loadComponent: () =>
      import('./app/configuration/configuration.component').then(
        (m) => m.ConfigurationComponent
      ),
  },
  {
    path: '**',
    redirectTo: '/calculator',
  },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideRouter(routes),
    {
      provide: SolverOrchestrator,
      useFactory: () => new SolverOrchestrator(),
    },
    {
      provide: MathJaxConfig,
      useValue: {
        inputLoader: MathJaxInputLoaderEnum.asciimath,
        outputLoader: MathJaxOutputLoaderEnum.svg,
      } as MathJaxConfig,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
}).catch((err) => console.error(err));
