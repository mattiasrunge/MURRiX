"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");
const loc = require("lib/location");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.loading;
    this.user = session.user;
    this.page = ko.pureComputed(() => {
        return ko.unwrap(loc.current().page);
    });

    this.random = () => {
    };
});
