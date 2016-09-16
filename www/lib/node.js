"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");
const utils = require("lib/utils");

module.exports = {
    getUniqueName: co.wrap(function*(parent, baseName) {
        parent = typeof parent === "string" ? yield api.vfs.resolve(parent) : parent;
        let name = utils.escapeName(baseName);
        let counter = 1;

        while (parent.properties.children.filter((child) => child.name === name).length > 0) {
            name = utils.escapeName(baseName) + "_" + counter;
            counter++;
        }

        return name;
    }),
    setProfilePicture: co.wrap(function*(abspath, picturePath) {
        yield api.vfs.unlink(abspath + "/profilePicture");
        yield api.vfs.symlink(picturePath, abspath + "/profilePicture");
    })
};
