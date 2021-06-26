const { resolve } = require("path");
const { readFileSync } = require("fs");

module.exports = JSON.parse(readFileSync(resolve("./package.json"))).jest;
