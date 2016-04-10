"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");

module.exports = utils.wrapComponent(function*(params) {
    this.node = params.node;
    this.section = params.section;
});
