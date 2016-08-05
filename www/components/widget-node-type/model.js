"use strict";

const utils = require("lib/utils");
const ko = require("knockout");

const types = {
    "a": "album",
    "l": "location",
    "p": "person",
    "c": "camera",
    "d": "directory",
    "f": "file",
    "s": "symlink",
    "k": "comment",
    "r": "root"
};

module.exports = utils.wrapComponent(function*(params) {
    this.type = ko.pureComputed(() => types[ko.unwrap(params.type)] || "unknown" );
});
