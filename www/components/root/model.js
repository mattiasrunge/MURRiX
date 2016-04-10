"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const loc = require("lib/location");

module.exports = utils.wrapComponent(function*(params) {
    this.page = ko.pureComputed(() => ko.unwrap(loc.current().page) || "recent");
});