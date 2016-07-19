"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const loc = require("lib/location");
const ui = require("lib/ui");
const status = require("lib/status");
const session = require("lib/session");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = node.nodepath;
    this.loading = node.loading;
    this.type = ko.pureComputed(() => this.nodepath() ? this.nodepath().node().properties.type : false);
    this.section = ko.pureComputed(() => ko.unwrap(loc.current().section) || "default");
    this.showPath = ko.pureComputed(() => ko.unwrap(loc.current().showPath));

    this.dispose = () => {
    };
});
