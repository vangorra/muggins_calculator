import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ObjectBuilder } from './utils';

@Injectable({
  providedIn: 'root',
})
export class ToolbarService {
  static DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
    title: '',
    buttons: [],
  };

  static NOOP_ONCLICK = () => undefined;

  static NOOP_OBSERVER = () => new Subject<boolean>();

  static newDefaultToolbarButton(): ToolbarButton {
    return {
      icon: undefined,
      title: '',
      onClick: ToolbarService.NOOP_ONCLICK,
      disabledObserver: ToolbarService.NOOP_OBSERVER,
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

  public readonly config = new BehaviorSubject<ToolbarConfig>(
    ToolbarService.DEFAULT_TOOLBAR_CONFIG
  );

  public set(updates: Partial<ToolbarConfig>): void {
    this.config.next(
      ObjectBuilder.newFromBase(ToolbarService.DEFAULT_TOOLBAR_CONFIG, updates)
    );
  }
}

export interface ToolbarButton {
  readonly icon?: string;
  readonly testId?: string;
  readonly title: string;
  readonly onClick: () => void;
  readonly disabledObserver: () => Observable<boolean>;
}

export interface ToolbarConfig {
  readonly title: string;
  readonly buttons: ToolbarButton[];
}
