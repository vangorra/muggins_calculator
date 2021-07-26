import { Component } from '@angular/core';
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
}
