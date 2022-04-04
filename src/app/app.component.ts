import '@fontsource/roboto';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import ColorSchemeService from './color-scheme.service';
import { MathJaxUtils } from './utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export default class AppComponent implements OnInit, OnDestroy {
  title = 'app';

  isMathJaxInitialized = false;

  private initializeCheckInterval: any;

  constructor(private colorSchemeService: ColorSchemeService) {
    colorSchemeService.subscribeToMediaChanges();
    colorSchemeService.applyStyle();
  }

  ngOnInit(): void {
    this.initializeCheckInterval = setInterval(() => {
      this.isMathJaxInitialized = MathJaxUtils.isMathJaxInitialized();

      if (this.isMathJaxInitialized) {
        clearInterval(this.initializeCheckInterval);
      }
    }, 100);
  }

  ngOnDestroy() {
    clearInterval(this.initializeCheckInterval);
  }

  getBrightnessSetting(): string {
    const persistedColorScheme =
      this.colorSchemeService.getPersistentColorScheme();
    return persistedColorScheme || 'auto';
  }

  onBrightnessSettingChanged($event: MatButtonToggleChange): void {
    if ($event.value === 'auto') {
      this.colorSchemeService.clearPersistentColorScheme();
    } else {
      this.colorSchemeService.setPersistentColorScheme($event.value);
    }
  }
}
