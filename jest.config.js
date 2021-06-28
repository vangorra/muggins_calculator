const { resolve } = require("path");
const { readFileSync } = require("fs");
require('jest-preset-angular/ngcc-jest-processor');

module.exports = JSON.parse(
  readFileSync(
    resolve("./package.json")
  ).toString()
).jest;
