"use strict";

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

model.type = ko.pureComputed(() => types[ko.unwrap(params.type)] || "unknown");