"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const loc = require("lib/location");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(/*params*/) {
    this.path = ko.pureComputed(() => ko.unwrap(loc.current().path) || false);
    this.section = ko.pureComputed(() => ko.unwrap(loc.current().section) || "default");
    this.nodepath = ko.nodepath(this.path);

    this.dispose = () => {
        this.nodepath.dispose();
    };
});
