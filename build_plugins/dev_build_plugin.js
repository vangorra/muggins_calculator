"use strict";

const buildActions = require("./build_actions");

exports.__esModule = true;
exports.default = {
  pre: buildActions.preEnableCoverage,
  post: buildActions.postCopyIndexTo404,
};
