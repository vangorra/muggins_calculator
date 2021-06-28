import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
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
import AppRoutingModule from "./app-routing.module";
import AppComponent from "./app.component";
import CalculatorComponent from "./calculator/calculator.component";
import DieComponent from "./die/die.component";
import ConfigComponent from "./config/config.component";

@NgModule({
  declarations: [
    AppComponent,
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
  providers: [],
  bootstrap: [AppComponent]
})
export default class AppModule { }
