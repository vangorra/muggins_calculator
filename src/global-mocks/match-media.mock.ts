/*
 * A fairly close to fully-function mock implementation of window.matchMedia().
 */

import { isFunction } from 'lodash';

/**
 * Rudimentary Media object for resolving whether media a media query matches the system media.
 */
export class Media {
  readonly media: { [name: string]: string | undefined } = {};

  public hasName(name: string): boolean {
    return Object.keys(this.media).indexOf(name) > -1;
  }

  public get(name: string): string | undefined {
    return this.media[name];
  }

  public getNames(): string[] {
    return Object.keys(this.media);
  }

  public add(name: string, value?: string): void {
    this.media[name] = value;
  }

  public remove(name: string): void {
    delete this.media[name];
  }

  /**
   * Output in a format like "(name: value) and (name)";
   */
  public toString(): string {
    return Object.entries(this.media)
      .map(([name, value]) => {
        let valueStr = '';
        if (value !== undefined) {
          valueStr = `: ${value}`;
        }

        return `(${name}${valueStr})`;
      })
      .join(' and ');
  }

  /**
   * matches('(prefers-color-scheme: dark)', '') === false
   * matches('', '(prefers-color-scheme: dark)') === false
   * matches('(prefers-color-scheme: dark)', '(prefers-color-scheme)') === true
   * matches('(prefers-color-scheme)', '(prefers-color-scheme: dark)') === false
   * @param sourceMedia
   * @param fitsIntoMedia
   */
  public static matches(sourceMedia: Media, fitsIntoMedia: Media): boolean {
    const sourceMediaNames = sourceMedia.getNames();
    if (!sourceMediaNames.length) {
      return false;
    }

    for (const sourceMediaName of sourceMediaNames) {
      const thisMediaValue = sourceMedia.get(sourceMediaName);

      if (!fitsIntoMedia.hasName(sourceMediaName)) {
        return false;
      }

      // Treating undefined as a wildcard.
      const fitsIntoMediaValue = fitsIntoMedia.get(sourceMediaName);
      if (
        fitsIntoMediaValue !== undefined &&
        thisMediaValue !== fitsIntoMediaValue
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Parse simple media strings formatted like "(name: value) and (name)".
   * @param media
   */
  public static parse(media: string): Media {
    const mediaObj = new Media();
    media
      .split(/ (and) /)
      .filter((part) => part.match(/\([^)]+\)/))
      .map((part) => part.split(/:/).map((p) => p.replace(/[(): ]/g, '')))
      .forEach(([name, value]) => {
        mediaObj.add(name, !!value ? value : undefined);
      });
    return mediaObj;
  }
}

export class MockMediaQueryList implements MediaQueryList {
  private readonly events: {
    [eventName: string]: EventListenerOrEventListenerObject[];
  } = {};

  public onchange: (event: MediaQueryListEvent) => undefined = () => undefined;

  constructor(
    private readonly getSystemMedia: () => Media,
    private readonly query: Media
  ) {}

  get media(): string {
    return this.query.toString();
  }

  get matches(): boolean {
    return Media.matches(this.getSystemMedia(), this.query);
  }

  /**
   * @deprecated
   * @param callback
   */
  public addListener(
    callback: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null // eslint-disable-line @typescript-eslint/no-unused-vars
  ): void {
    throw new Error('Method not implemented.');
  }

  /**
   * @deprecated
   * @param callback
   */
  public removeListener(
    callback: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null // eslint-disable-line @typescript-eslint/no-unused-vars
  ): void {
    throw new Error('Method not implemented.');
  }

  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean // eslint-disable-line @typescript-eslint/no-unused-vars
  ): void {
    if (!callback) {
      return;
    }

    this.events[type] = this.getEventListenersByName(type).concat([callback]);
  }

  private getEventListenersByName(
    eventName: string
  ): EventListenerOrEventListenerObject[] {
    return this.events[eventName] || [];
  }

  dispatchEvent(event: MediaQueryListEvent): boolean {
    if (event.type === 'change') {
      this.onchange(event);
    }

    this.getEventListenersByName(event.type).forEach((callback) => {
      if (callback.hasOwnProperty('handleEvent')) {
        (callback as EventListenerObject).handleEvent.call(this, event);
        return;
      }

      if (isFunction(callback)) {
        callback.call(this, event);
        return;
      }
    });

    return false;
  }

  eventListeners(eventName?: string): EventListenerOrEventListenerObject[] {
    if (eventName) {
      return this.getEventListenersByName(eventName);
    }

    return Object.values(this.events).flatMap((arr) => arr);
  }

  removeAllListeners(eventName?: string): void {
    if (!eventName) {
      Object.keys(this.events).forEach((key) => {
        delete this.events[key];
      });
    } else {
      this.events[eventName] = [];
    }
  }

  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean // eslint-disable-line @typescript-eslint/no-unused-vars
  ): void {
    if (!!callback) {
      const events = this.getEventListenersByName(type);
      const index = events.indexOf(callback);
      events.splice(index, 1);
    }
  }
}

/**
 * Manages MockMediaQueryList objects and queries.
 */
export class MockMatchMediaManager {
  public static DEFAULT_MEDIA = '';

  readonly matchMediaArray: MockMediaQueryList[] = [];

  private media: Media;

  constructor(private mediaString = MockMatchMediaManager.DEFAULT_MEDIA) {
    this.media = Media.parse(mediaString);
  }

  public getMediaString(): string {
    return this.mediaString;
  }

  public get(): Media {
    return this.media;
  }

  public set(media: string, eventType: string): void {
    this.mediaString = media;
    this.media = Media.parse(media);

    // Dispatch events to all MediaQueryList objects that match.
    this.matchMediaArray
      // Get matching MediaQueryList objects by making a single call to the "matches" property.
      .map((mockMediaQueryList) => ({
        obj: mockMediaQueryList,
        matches: mockMediaQueryList.matches,
      }))
      .filter((obj) => obj.matches)
      .map((obj) => obj.obj)
      .forEach((matchMediaMock) => {
        matchMediaMock.dispatchEvent({
          type: eventType,
          matches: matchMediaMock.matches,
          media,
        } as any);
      });
  }

  public reset(): void {
    this.matchMediaArray.forEach((matchMedia) =>
      matchMedia.removeAllListeners()
    );
    this.matchMediaArray.splice(0, this.matchMediaArray.length);
  }

  readonly getCurrentMediaCallback = () => this.get();

  getOrCreateMockMediaQueryList(query: string): MockMediaQueryList {
    const matchMediaQueryList = new MockMediaQueryList(
      this.getCurrentMediaCallback,
      Media.parse(query)
    );
    this.matchMediaArray.push(matchMediaQueryList);
    return matchMediaQueryList;
  }

  /**
   * Use this function when replacing functionality for window.matchMedia.
   * @param query
   */
  public matchMedia = (query: string) =>
    this.getOrCreateMockMediaQueryList(query);
}

declare global {
  interface Window {
    mockMatchMediaManager: MockMatchMediaManager;
  }
}

const mockMatchMediaManager = new MockMatchMediaManager();

Object.defineProperty(window, 'mockMatchMediaManager', {
  value: mockMatchMediaManager,
  writable: false,
  configurable: false,
});

Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMediaManager.matchMedia,
});
