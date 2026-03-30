import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './theme.service';
import { MathJaxService } from './math-jax/math-jax.service';
import { ToolbarComponent } from './toolbar/toolbar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, ToolbarComponent],
})
export default class AppComponent implements OnInit {
  isFontsLoaded = false;

  // ThemeService injection ensures it loads and sets the theme on startup.
  private readonly themeService = inject(ThemeService);
  readonly mathJaxService = inject(MathJaxService);

  ngOnInit(): void {
    this.mathJaxService.start();

    // Wait for fonts to have finished loading. This avoids the situation where mat-icon briefly shows the icon
    // text while the fonts are still loading.
    document.fonts.ready.then(() => (this.isFontsLoaded = true));
  }
}
