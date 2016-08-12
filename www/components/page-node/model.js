"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const loc = require("lib/location");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(/*params*/) {
    this.nodepath = node.nodepath;
    this.nodeLoading = node.loading;
    this.section = ko.pureComputed(() => ko.unwrap(loc.current().section) || "default");
    this.type = ko.pureComputed(() => this.nodepath() ? this.nodepath().node().properties.type : false);

    this.dispose = () => {
    };
});
