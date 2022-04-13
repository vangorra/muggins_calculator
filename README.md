# Muggins Calculator ![Build status](https://github.com/vangorra/muggins_calculator/workflows/Build/badge.svg?branch=main) [![Coverage Status](https://coveralls.io/repos/github/vangorra/muggins_calculator/badge.svg)](https://coveralls.io/github/vangorra/muggins_calculator)

Aa app for discovering and checking answers to the popular math game Muggins.

## Quickstart

Goto: https://vangorra.github.io/muggins_calculator/

## Development

Full build with code formatting, linting and testing.
```shell
npm install
```

```shell
gulp build
```

### Run and serve the app on localhost.

#### Serve fully end-to-end with all browser features

This does not use `ng serve` as the former lacks support for progressive web apps (PWA).
Instead, `ng build --watch` is used to build on code changes, and a separate http server serves the files.
```shell
gulp serve
```

#### Serve quick for development

This lacks support for progressive web apps but allows for faster development.

```shell
ng serve
```

### Continually test the app.
```shell
gulp testWatch
```

## Notes

### MathJax

This app uses mathjax to format equations in a way humans are familiar.
The following describes how mathjax assets are stored.

- package.json - Added mathjax as a dependency.
- angular.json - Added build asset for the mathjax/es5 directory. This will ensure our
bundled version is all we every use and is served locally.
- src/app/math-jax - An angular module, directive and service that supports using MathJax.
- src/test.ts - Add a window value for MathJax initially for testing.
