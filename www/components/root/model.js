"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const loc = require("lib/location");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(params) {
    this.loggedIn = session.loggedIn;
    this.page = ko.pureComputed(() => ko.unwrap(loc.current().page) || "recent");
});
