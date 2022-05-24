import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import AppRoutingModule from './app-routing.module';
import AppComponent from './app.component';
import CalculatorComponent from './calculator/calculator.component';
import DieComponent from './die/die.component';
import environment from '../environments/environment';
import { ConfigurationComponent } from './configuration/configuration.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { AboutDialogComponent } from './about-dialog/about-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ScrollToTopComponent } from './scroll-to-top/scroll-to-top.component';
import { DiceComponent } from './dice/dice.component';
import { MathJaxModule } from './math-jax/math-jax.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { UiScrollModule } from 'ngx-ui-scroll';
import { MugginsSolverOrchestrator } from './solver/solver';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@NgModule({
  declarations: [
    AppComponent,
    CalculatorComponent,
    DieComponent,
    ConfigurationComponent,
    ToolbarComponent,
    AboutDialogComponent,
    ConfirmDialogComponent,
    ScrollToTopComponent,
    DiceComponent,
  ],
  imports: [
    MathJaxModule.withConfig(),
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
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    MatProgressBarModule,
    MatInputModule,
    MatButtonToggleModule,
    MatIconModule,
    MatToolbarModule,
    MatDialogModule,
    MatSnackBarModule,
    UiScrollModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
  providers: [
    {
      provide: MugginsSolverOrchestrator,
      useFactory: () =>
        new MugginsSolverOrchestrator({
          useWorker: !!window.Worker,
          // Save two threads for the UI and solver.
          workerCount: Math.max(navigator.hardwareConcurrency - 2, 1),
        }),
    },
  ],
  bootstrap: [AppComponent],
})
export default class AppModule {}
