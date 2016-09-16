"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const log = require("../../core/lib/log")(module);

let params = {};

const escapeName = (name) => {
    return name.replace(/ |\//g, "_");
};

let node = api.register("node", {
    deps: [ "vfs" ],
    init: co(function*(config) {
        params = config;
    }),
    getUniqueName: function*(session, abspath, name) {
        let parent = yield api.vfs.resolve(session, abspath);
        let names = parent.properties.children.map((child) => child.name);
        let escapedName = escapeName(name);
        let result = escapedName;
        let counter = 1;

        while (names.includes(result)) {
            result = escapedName + "_" + counter;
            counter++;
        }

        return result;
    },
    setProfilePicture: function*(session, abspath, picturePath) {
        yield api.vfs.unlink(session, path.join(abspath, "profilePicture"));
        yield api.vfs.symlink(session, picturePath, path.join(abspath, "profilePicture"));
    }
});

module.exports = node;
