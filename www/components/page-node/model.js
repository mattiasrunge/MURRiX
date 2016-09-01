"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const loc = require("lib/location");
const ui = require("lib/ui");

module.exports = utils.wrapComponent(function*(/*params*/) {
    this.path = ko.pureComputed(() => ko.unwrap(loc.current().path) || false);
    this.section = ko.pureComputed(() => ko.unwrap(loc.current().section) || "default");
    this.nodepath = ko.nodepath(this.path);

    let subscription = this.nodepath.subscribe((nodepath) => {
        ui.setTitle(nodepath ? nodepath.node().attributes.name : false);
    });

    this.dispose = () => {
        subscription.dispose();
        this.nodepath.dispose();
    };
});
