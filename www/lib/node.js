"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");
const loc = require("lib/location");
const ui = require("lib/ui");
const stat = require("lib/status");

module.exports = {
    list: ko.observableArray(),
    escapeName: (name) => {
        return name.replace(/ |\//g, "_");
    },
    basename: (path) => {
        return path.replace(/.*\//, "");
    },
    dirname: (path) => {
        return path.match(/(.*)[\/]/)[1];
    },
    getUniqueName: co.wrap(function*(parent, baseName) {
        parent = typeof parent === "string" ? yield api.vfs.resolve(parent) : parent;
        let name = module.exports.escapeName(baseName);
        let counter = 1;

        while (parent.properties.children.filter((child) => child.name === name).length > 0) {
            name = module.exports.escapeName(baseName) + "_" + counter;
            counter++;
        }

        return name;
    }),
    setProfilePicture: co.wrap(function*(abspath, picturePath) {
        yield api.vfs.unlink(abspath + "/profilePicture");
        yield api.vfs.symlink(picturePath, abspath + "/profilePicture");
    })
};
