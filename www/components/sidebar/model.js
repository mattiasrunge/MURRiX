"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const loc = require("lib/location");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(/*params*/) {
    this.user = session.user;
    this.loggedIn = session.loggedIn;
    this.page = ko.pureComputed(() => {
        return ko.unwrap(loc.current().page);
    });
});
