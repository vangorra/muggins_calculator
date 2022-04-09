import { TestBed } from '@angular/core/testing';

import { ConfigurationService } from './configuration.service';
import { DEFAULT_CONFIGURATION } from './const';

describe('ConfigurationService', () => {
  let service: ConfigurationService;

  beforeEach(() => {
    localStorage.removeItem(ConfigurationService.STORAGE_KEY);

    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigurationService);
  });

  fit('modify works', () => {
    expect(service).toBeTruthy();
    expect(service.get()).toBe(DEFAULT_CONFIGURATION);
    expect(service.get().dice.length).toBe(DEFAULT_CONFIGURATION.dice.length);

    service.addDie();
    expect(service.get().dice.length).toBe(
      DEFAULT_CONFIGURATION.dice.length + 1
    );

    service.removeDie();
    service.removeDie();
    expect(service.get().dice.length).toBe(
      DEFAULT_CONFIGURATION.dice.length - 1
    );

    service.removeDie();
    service.removeDie();
    service.removeDie();
    service.removeDie();
    expect(service.get().dice.length).toBe(0);

    service.addDie();
    service.addDie();
    service.addDie();
    expect(service.get().dice.length).toBe(3);

    service.save();
    const savedConfiguration = service.get();
    service.update({
      board: {
        minSize: 1,
        maxSize: 2,
      },
    });
    expect(service.get().board).toEqual({
      minSize: 1,
      maxSize: 2,
    });
    service.load();
    expect(service.get()).toEqual(savedConfiguration);

    service.update({
      board: {
        minSize: 1,
        maxSize: 2,
      },
    });
    service.save();
    expect(service.get().board).toEqual({
      minSize: 1,
      maxSize: 2,
    });
    service.load();
    expect(service.get().board).toEqual({
      minSize: 1,
      maxSize: 2,
    });
  });
});
