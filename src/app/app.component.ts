import '@fontsource/roboto';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ThemeService } from './theme.service';
import { MathJaxService } from './math-jax.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export default class AppComponent implements OnInit, OnDestroy {
  constructor(
    private readonly themeService: ThemeService,
    readonly mathJaxService: MathJaxService
  ) {}

  ngOnInit(): void {
    this.themeService.start();
    this.mathJaxService.startPoll();
  }

  ngOnDestroy() {
    this.themeService.stop();
    this.mathJaxService.stopPoll();
  }

  public getRouterOutletState(outlet: RouterOutlet) {
    return outlet.isActivated ? outlet.activatedRoute : '';
  }
}
