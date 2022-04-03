import '@fontsource/roboto';
import { Component } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import ColorSchemeService from './color-scheme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export default class AppComponent {
  title = 'app';

  constructor(private colorSchemeService: ColorSchemeService) {
    colorSchemeService.subscribeToMediaChanges();
    colorSchemeService.applyStyle();
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
