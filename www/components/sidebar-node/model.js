"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const session = require("lib/session");
const loc = require("lib/location");

module.exports = utils.wrapComponent(function*(params) {
    this.type = ko.pureComputed(() => {
        return this.node() ? this.node().properties.type : false;
    });
    this.section = ko.pureComputed(() => {
        return ko.unwrap(loc.current().section) || "about";
    });
    this.node = session.node;
});
