/* eslint-disable import/no-extraneous-dependencies */
import "jest-preset-angular";

Object.defineProperty(window, 'CSS', {value: null});
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
      display: 'none',
      appearance: ['-webkit-appearance'],
      getPropertyValue: () => undefined
    })
});

Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>'
});
Object.defineProperty(document.body.style, 'transform', {
  value: () => ({
      enumerable: true,
      configurable: true
    })
});
