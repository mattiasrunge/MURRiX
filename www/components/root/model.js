"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const loc = require("lib/location");
const session = require("lib/session");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(/*params*/) {
    this.loading = stat.loading;
    this.loggedIn = session.loggedIn;
    this.page = ko.pureComputed(() => ko.unwrap(loc.current().page) || "default");
    this.showPath = ko.pureComputed(() => ko.unwrap(loc.current().showPath));
});
