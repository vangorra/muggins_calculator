import { Component, OnInit } from '@angular/core';
import { ThemeService } from './theme.service';
import { MathJaxService } from './math-jax/math-jax.service';
import { Router } from '@angular/router';
import { isString } from 'lodash';
import { STORAGE_KEY_404_REDIRECT_PATH } from './const';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export default class AppComponent implements OnInit {
  isFontsLoaded = false;

  /**
   * ThemeService is not used in this component. However, the act of the service being
   * created in injected means it loaded and set the theme.
   * @param themeService
   * @param mathJaxService
   * @param router
   */
  constructor(
    private readonly themeService: ThemeService,
    readonly mathJaxService: MathJaxService,
    private readonly router: Router
  ) {
    // See 404.html for where this is set. On github pages, the 404.html page is loaded which sets the destination
    // path and redirects to root of the application. then we retrieve the desired path and route there.
    const initialPath = localStorage.getItem(STORAGE_KEY_404_REDIRECT_PATH);
    if (!!initialPath && isString(initialPath)) {
      localStorage.removeItem(STORAGE_KEY_404_REDIRECT_PATH);
      router.navigate([initialPath]);
    }
  }

  ngOnInit(): void {
    this.mathJaxService.start();

    // Wait for fonts to have finished loading. This avoids the situation where mat-icon briefly shows the icon
    // text while the fonts are still loading.
    document.fonts.ready.then(() => (this.isFontsLoaded = true));
  }
}
