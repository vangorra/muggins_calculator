import { Injectable, Signal, signal } from '@angular/core';
import { ObjectBuilder } from './utils';

const NOOP_SIGNAL = signal(false);

@Injectable({
  providedIn: 'root',
})
export class ToolbarService {
  static DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
    title: '',
    buttons: [],
  };

  static NOOP_ONCLICK = () => undefined;

  static NOOP_DISABLED_SIGNAL = () => NOOP_SIGNAL as Signal<boolean>;

  static newDefaultToolbarButton(): ToolbarButton {
    return {
      icon: undefined,
      title: '',
      onClick: ToolbarService.NOOP_ONCLICK,
      disabledSignal: ToolbarService.NOOP_DISABLED_SIGNAL,
    };
  }

  public static newButton(
    updates: Pick<ToolbarButton, 'title'> | ToolbarButton
  ): ToolbarButton {
    return ObjectBuilder.newFromBase(
      ToolbarService.newDefaultToolbarButton(),
      updates
    );
  }

  public readonly config = signal<ToolbarConfig>(
    ToolbarService.DEFAULT_TOOLBAR_CONFIG
  );

  public set(updates: Partial<ToolbarConfig>): void {
    this.config.set(
      ObjectBuilder.newFromBase(ToolbarService.DEFAULT_TOOLBAR_CONFIG, updates)
    );
  }
}

export interface ToolbarButton {
  readonly icon?: string;
  readonly testId?: string;
  readonly title: string;
  readonly onClick: () => void;
  readonly disabledSignal: () => Signal<boolean>;
}

export interface ToolbarConfig {
  readonly title: string;
  readonly buttons: ToolbarButton[];
}
