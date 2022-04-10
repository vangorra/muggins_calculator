import { Injectable } from '@angular/core';
import { Configuration } from './general_types';
import { DEFAULT_CONFIGURATION, DEFAULT_DIE_FACE_COUNT } from './const';
import { cloneDeep } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { ObjectBuilder } from './utils';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  public static readonly STORAGE_KEY = 'configuration';

  private configuration: Configuration = DEFAULT_CONFIGURATION;

  public readonly value = new BehaviorSubject<Configuration>(
    this.configuration
  );

  constructor() {
    this.load();
  }

  public resetToDefaults(): void {
    this.set(DEFAULT_CONFIGURATION);
  }

  public update(updates: RecursivePartial<Configuration>): void {
    this.set(
      ObjectBuilder.newFromBaseArray(
        [DEFAULT_CONFIGURATION, this.configuration],
        updates
      )
    );
  }

  private set(configuration: Configuration): void {
    this.configuration = configuration;
    this.value.next(this.configuration);
  }

  load(): void {
    // Fallback on the default configuration is nothing came back from local storage.
    const configuration: Configuration =
      JSON.parse(
        localStorage.getItem(ConfigurationService.STORAGE_KEY) || 'null'
      ) || DEFAULT_CONFIGURATION;
    this.update(configuration);
  }

  save(): void {
    localStorage.setItem(
      ConfigurationService.STORAGE_KEY,
      JSON.stringify(this.configuration, null, '  ')
    );
  }

  public addDie() {
    this.update({
      dice: [
        ...this.configuration.dice,
        {
          faceCount: DEFAULT_DIE_FACE_COUNT,
        },
      ],
    });
  }

  public removeDie() {
    const dice = cloneDeep(this.configuration.dice);
    dice.pop();

    this.update({
      dice,
    });
  }
}
