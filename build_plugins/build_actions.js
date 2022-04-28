"use strict";

const fs = require("fs");

/**
 * Copy the index.html to 404.html to make github pages work nicely with our single page app.
 * @param options
 */
exports.postCopyIndexTo404 = (options) => {
  fs.copyFileSync("./dist/app/index.html", "./dist/app/404.html");
};

/**
 * Enable code coverage prior to angular build to facilitate end-to-end testing.
 * @param options
 */
exports.preEnableCoverage = (options) => {
  console.log("Enabling code coverage in Angular app.");
  options.codeCoverage = true;
  options.budgets = [];
};

exports.chainActions = (isChainedReturn, ...actions) => {
  return (firstArg) => {
    let currentArg = firstArg;
    for (action of actions) {
      const returnValue = action(currentArg);
      if (isChainedReturn) {
        currentArg = returnValue;
      }
    }
    return currentArg;
  };
};
