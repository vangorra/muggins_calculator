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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { ServiceWorkerModule } from '@angular/service-worker';
import { HttpClientModule } from '@angular/common/http';
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
import { MathJaxComponent } from './math-jax/math-jax.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ScrollToTopComponent } from './scroll-to-top/scroll-to-top.component';
import { DiceComponent } from './dice/dice.component';

@NgModule({
  declarations: [
    AppComponent,
    CalculatorComponent,
    DieComponent,
    ConfigurationComponent,
    ToolbarComponent,
    AboutDialogComponent,
    MathJaxComponent,
    ConfirmDialogComponent,
    ScrollToTopComponent,
    DiceComponent,
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
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatBottomSheetModule,
    MatButtonToggleModule,
    MatIconModule,
    HttpClientModule,
    MatToolbarModule,
    MatDialogModule,
    MatSnackBarModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    MatToolbarModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export default class AppModule {}
