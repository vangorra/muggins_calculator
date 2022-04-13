import { TestBed } from '@angular/core/testing';

import { ConfigurationService } from './configuration.service';
import { DEFAULT_CONFIGURATION } from './const';

describe(ConfigurationService.name, () => {
  let service: ConfigurationService;

  beforeEach(() => {
    localStorage.removeItem(ConfigurationService.STORAGE_KEY);

    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigurationService);
  });

  it('modify works', () => {
    expect(service).toBeTruthy();
    expect(service.value.getValue()).toEqual(DEFAULT_CONFIGURATION);
    expect(service.value.getValue().dice.length).toBe(
      DEFAULT_CONFIGURATION.dice.length
    );

    service.addDie();
    expect(service.value.getValue().dice.length).toBe(
      DEFAULT_CONFIGURATION.dice.length + 1
    );

    service.removeDie();
    service.removeDie();
    expect(service.value.getValue().dice.length).toBe(
      DEFAULT_CONFIGURATION.dice.length - 1
    );

    service.removeDie();
    service.removeDie();
    service.removeDie();
    service.removeDie();
    expect(service.value.getValue().dice.length).toBe(0);

    service.addDie();
    service.addDie();
    service.addDie();
    expect(service.value.getValue().dice.length).toBe(3);

    service.save();
    const savedConfiguration = service.value.getValue();
    service.update({
      board: {
        minSize: 1,
        maxSize: 2,
      },
    });
    expect(service.value.getValue().board).toEqual({
      minSize: 1,
      maxSize: 2,
    });
    service.load();
    expect(service.value.getValue()).toEqual(savedConfiguration);

    service.update({
      board: {
        minSize: 1,
        maxSize: 2,
      },
    });
    service.save();
    expect(service.value.getValue().board).toEqual({
      minSize: 1,
      maxSize: 2,
    });
    service.load();
    expect(service.value.getValue().board).toEqual({
      minSize: 1,
      maxSize: 2,
    });
  });
});
