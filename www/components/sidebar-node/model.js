"use strict";

/* TODO:
 * Make a nicer footer for nodes
 */

const ko = require("knockout");
const utils = require("lib/utils");
const session = require("lib/session");
const loc = require("lib/location");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = node.nodepath;
    this.type = ko.pureComputed(() => {
        return this.nodepath() ? this.nodepath().node().properties.type : false;
    });
    this.section = ko.pureComputed(() => {
        return ko.unwrap(loc.current().section) || "about";
    });
});
