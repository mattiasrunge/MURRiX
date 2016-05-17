"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const loc = require("lib/location");
const api = require("api.io-client");
const status = require("lib/status");
const session = require("lib/session");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = node.nodepath;
    this.type = ko.pureComputed(() => {
        return this.nodepath() ? this.nodepath().node.properties.type : false;
    });
    this.section = ko.pureComputed(() => {
        return ko.unwrap(loc.current().section) || "default";
    });

    this.dispose = () => {
    };
});
