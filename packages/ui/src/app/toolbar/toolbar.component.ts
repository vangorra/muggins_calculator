import { Component, computed, inject } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { ToolbarService } from '../toolbar.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  imports: [MatToolbar, MatIcon, MatIconButton],
})
export class ToolbarComponent {
  private readonly toolbarService = inject(ToolbarService);
  readonly config = computed(() => this.toolbarService.config());
}
