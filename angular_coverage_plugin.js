"use strict";
/*
This script is used in gulp.ts to serve the app for end-to-end tests. This plugin is used by
ngx-build-plus to enable Angular's instrumentation feature. Typically, this is only available to the karma.
 */
exports.__esModule = true;
exports["default"] = {
  pre: function (options) {
    console.log("Enabling code coverage in Angular app.");
    options.codeCoverage = true;
    options.budgets = [];
  },
};
