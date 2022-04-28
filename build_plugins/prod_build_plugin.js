"use strict";

const buildActions = require("./build_actions");

exports.__esModule = true;
exports.default = {
  post: buildActions.postCopyIndexTo404,
};
