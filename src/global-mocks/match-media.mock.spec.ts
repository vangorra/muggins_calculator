import {
  Media,
  MockMatchMediaManager,
  MockMediaQueryList,
} from './match-media.mock';

describe(Media.name, function () {
  const fitsInto = (
    sourceMedia: string,
    fitsIntoMedia: string,
    expectValue: boolean
  ) => {
    test(`'${sourceMedia}' matches '${fitsIntoMedia}' is ${expectValue}`, () => {
      const source = Media.parse(sourceMedia);
      const target = Media.parse(fitsIntoMedia);

      expect(Media.matches(source, target)).toEqual(expectValue);
    });
  };

  fitsInto('(prefers-color-scheme: dark)', '', false);
  fitsInto('', '(prefers-color-scheme: dark)', false);
  fitsInto('(prefers-color-scheme: dark)', '(prefers-color-scheme)', true);
  fitsInto('(prefers-color-scheme)', '(prefers-color-scheme: dark)', false);

  const parseTo = (
    sourceMedia: string,
    expectMap: { [name: string]: string | undefined }
  ) => {
    const expectMapStr = JSON.stringify(expectMap);
    test(`parse '${sourceMedia}' to match '${expectMapStr}'`, () => {
      expect(Media.parse(sourceMedia).media).toEqual(expectMap);
    });
  };

  parseTo('', {});
  parseTo('(prefers-color-scheme)', { 'prefers-color-scheme': undefined });
  parseTo('(prefers-color-scheme: dark)', { 'prefers-color-scheme': 'dark' });
  parseTo('(att1) and (att2: value2) and (att3: value3)', {
    att1: undefined,
    att2: 'value2',
    att3: 'value3',
  });

  const toString = (source: Media, expectString: string) => {
    const sourceString = JSON.stringify(source);
    test(`${sourceString} toString to '${expectString}'`, () => {
      expect(source.toString()).toEqual(expectString);
    });
  };

  toString(Media.parse(''), '');
  toString(Media.parse('(prefers-color-scheme)'), '(prefers-color-scheme)');
  toString(
    Media.parse('(prefers-color-scheme: dark)'),
    '(prefers-color-scheme: dark)'
  );
  toString(
    Media.parse('(att1) and (att2: value2) and (att3: value3)'),
    '(att1) and (att2: value2) and (att3: value3)'
  );
  toString(
    Media.parse('(att1) and (att2:value2) and (att3:value3)'),
    '(att1) and (att2: value2) and (att3: value3)'
  );
});

describe(MockMediaQueryList.name, () => {
  test('add and remove listeners', () => {
    const getCurrentMedia = jest.fn();
    const changeListener1 = jest.fn();
    const changeListener2 = jest.fn();

    const newListener1 = jest.fn();
    const newListener2 = jest.fn();

    const mediaQueryList = new MockMediaQueryList(
      getCurrentMedia,
      Media.parse('')
    );
    expect(mediaQueryList.eventListeners()).toEqual([]);
    expect(mediaQueryList.eventListeners('change')).toEqual([]);
    expect(mediaQueryList.eventListeners('new')).toEqual([]);

    mediaQueryList.addEventListener('change', changeListener1);
    mediaQueryList.addEventListener('change', changeListener2);

    mediaQueryList.addEventListener('new', newListener1);
    mediaQueryList.addEventListener('new', newListener2);

    expect(mediaQueryList.eventListeners()).toEqual([
      changeListener1,
      changeListener2,
      newListener1,
      newListener2,
    ]);
    expect(mediaQueryList.eventListeners('change')).toEqual([
      changeListener1,
      changeListener2,
    ]);
    expect(mediaQueryList.eventListeners('new')).toEqual([
      newListener1,
      newListener2,
    ]);

    mediaQueryList.removeAllListeners('new');
    expect(mediaQueryList.eventListeners()).toEqual([
      changeListener1,
      changeListener2,
    ]);
    expect(mediaQueryList.eventListeners('change')).toEqual([
      changeListener1,
      changeListener2,
    ]);
    expect(mediaQueryList.eventListeners('new')).toEqual([]);

    mediaQueryList.removeEventListener('change', changeListener2);
    expect(mediaQueryList.eventListeners()).toEqual([changeListener1]);
    expect(mediaQueryList.eventListeners('change')).toEqual([changeListener1]);
    expect(mediaQueryList.eventListeners('new')).toEqual([]);

    mediaQueryList.removeAllListeners('change');
    expect(mediaQueryList.eventListeners()).toEqual([]);
    expect(mediaQueryList.eventListeners('change')).toEqual([]);
    expect(mediaQueryList.eventListeners('new')).toEqual([]);
  });

  const matches = (
    systemMedia: string,
    sourceMedia: string,
    expectResult: boolean
  ) => {
    test(`'${sourceMedia}' fits into '${systemMedia}' is ${expectResult}`, () => {
      const getSystemMedia = jest
        .fn()
        .mockReturnValue(Media.parse(systemMedia));

      const mediaQueryList = new MockMediaQueryList(
        getSystemMedia,
        Media.parse(sourceMedia)
      );
      expect(mediaQueryList.matches).toEqual(expectResult);
    });
  };

  matches('', '(prefers-color-scheme: dark)', false);
  matches('(prefers-color-scheme: dark)', '', false);
  matches('(prefers-color-scheme: dark)', '(prefers-color-scheme)', true);
  matches('(prefers-color-scheme)', '(prefers-color-scheme: dark)', false);

  test('dispatchEvent', () => {
    const getCurrentMedia = jest.fn().mockReturnValue('');
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    const event1 = {
      type: 'change',
      matches: true,
      media: '',
    } as MediaQueryListEvent;

    const event2 = {
      type: 'add',
      matches: true,
      media: '',
    } as MediaQueryListEvent;

    const mediaQueryList = new MockMediaQueryList(
      getCurrentMedia,
      Media.parse('')
    );
    mediaQueryList.addEventListener('change', listener1);
    mediaQueryList.addEventListener('other', listener2);

    mediaQueryList.dispatchEvent(event1);
    mediaQueryList.dispatchEvent(event2);

    expect(listener1).toHaveBeenCalledWith(event1);
    expect(listener2).not.toHaveBeenCalled();
  });
});

describe(MockMatchMediaManager.name, function () {
  test('set and get media', () => {
    const media = Media.parse('(prefers-color-scheme: dark)');
    const mediaManager = new MockMatchMediaManager(
      '(prefers-color-scheme: dark)'
    );
    expect(mediaManager.get()).toEqual(media);
    expect(mediaManager.getCurrentMediaCallback()).toEqual(media);
    expect(mediaManager.getMediaString()).toEqual(
      '(prefers-color-scheme: dark)'
    );
  });

  test('set fires when matches', () => {
    const colorListener = jest.fn();
    const otherListener = jest.fn();

    const mediaManager = new MockMatchMediaManager();
    const colorMediaQueryList = mediaManager.matchMedia(
      '(prefers-color-scheme)'
    );
    colorMediaQueryList.addEventListener('change', colorListener);

    const otherMediaQueryList = mediaManager.matchMedia('(other)');
    otherMediaQueryList.addEventListener('change', otherListener);

    mediaManager.set('(prefers-color-scheme: dark)', 'change');
    expect(colorListener).toHaveBeenCalled();
    expect(otherListener).not.toHaveBeenCalled();
  });

  test('reset removes all listeners and media query lists', () => {
    const colorListener = jest.fn();
    const mediaManager = new MockMatchMediaManager();
    const colorMediaQueryList = mediaManager.matchMedia(
      '(prefers-color-scheme)'
    );
    colorMediaQueryList.addEventListener('change', colorListener);

    mediaManager.reset();
    expect(colorMediaQueryList.eventListeners()).toEqual([]);
    expect(mediaManager.matchMediaArray).toEqual([]);
  });
});
