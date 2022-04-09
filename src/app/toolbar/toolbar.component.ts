import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToolbarConfig, ToolbarService } from '../toolbar.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit, OnDestroy {
  config?: ToolbarConfig;

  private readonly toolbarService: ToolbarService;

  private configSubscription?: Subscription;

  constructor(toolbarService: ToolbarService) {
    this.toolbarService = toolbarService;
  }

  ngOnInit(): void {
    this.configSubscription = this.toolbarService.config.subscribe(
      (config) => (this.config = config)
    );
  }

  ngOnDestroy(): void {
    this.configSubscription?.unsubscribe();
  }
}
