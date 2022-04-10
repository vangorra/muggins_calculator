import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ObjectBuilder } from './utils';

@Injectable({
  providedIn: 'root',
})
export class ToolbarService {
  private static DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
    title: '',
    buttons: [],
  };

  private static DEFAULT_TOOLBAR_BUTTON: ToolbarButton = {
    icon: undefined,
    title: '',
    onClick: () => undefined,
    disabled: new BehaviorSubject<boolean>(false),
    visible: new BehaviorSubject<boolean>(true),
  };

  public static newButton(
    updates: Pick<ToolbarButton, 'title'> | ToolbarButton
  ): ToolbarButton {
    return ObjectBuilder.newFromBase(
      ToolbarService.DEFAULT_TOOLBAR_BUTTON,
      updates
    );
  }

  public readonly config = new BehaviorSubject<ToolbarConfig>(
    ToolbarService.DEFAULT_TOOLBAR_CONFIG
  );

  public set(updates: Pick<ToolbarConfig, 'title'> | ToolbarConfig): void {
    this.config.next(
      ObjectBuilder.newFromBase(ToolbarService.DEFAULT_TOOLBAR_CONFIG, updates)
    );
  }
}

export interface ToolbarButton {
  readonly icon?: string;
  readonly title: string;
  readonly onClick: () => void;
  readonly disabled: Subject<boolean>;
  readonly visible: Subject<boolean>;
}

export interface ToolbarConfig {
  readonly title: string;
  readonly buttons: ToolbarButton[];
}
