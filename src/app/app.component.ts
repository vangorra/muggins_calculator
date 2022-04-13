import '@fontsource/roboto';
import { Component, OnInit } from '@angular/core';
import { ThemeService } from './theme.service';
import { MathJaxService } from './math-jax/math-jax.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export default class AppComponent implements OnInit {
  /**
   * ThemeService is not used in this component. However, the act of the service being
   * created in injected means it loaded and set the theme.
   * @param themeService
   * @param mathJaxService
   */
  constructor(
    private readonly themeService: ThemeService,
    readonly mathJaxService: MathJaxService
  ) {}

  ngOnInit(): void {
    this.mathJaxService.start();
  }
}
