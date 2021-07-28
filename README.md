# Muggins Calculator ![Build status](https://github.com/vangorra/muggins_calculator/workflows/Build/badge.svg?branch=main) [![Coverage Status](https://coveralls.io/repos/github/vangorra/muggins_calculator/badge.svg)](https://coveralls.io/github/vangorra/muggins_calculator)

Tool for providing equations for the popular math game Muggins.

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

Run and serve the app on localhost.
Note: This does not use `ng serve` as the former lacks support for progressive web apps (PWA).
Instead, `ng build --watch` is used to build on code changes, and a separate http server serves the files.
```shell
gulp serve
```

Continually test the app.
```shell
gulp testWatch
```
