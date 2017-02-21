"use strict";

const path = require("path");
const api = require("api.io");
const log = require("../../core/lib/log")(module);

let params = {};

const escapeName = (name) => {
    return name.replace(/ |\//g, "_");
};

const node = api.register("node", {
    deps: [ "vfs" ],
    init: async (config) => {
        params = config;
    },
    getUniqueName: api.export(async (session, abspath, name) => {
        let parent = await api.vfs.resolve(session, abspath);
        let names = parent.properties.children.map((child) => child.name);
        let escapedName = escapeName(name);
        let result = escapedName;
        let counter = 1;

        while (names.includes(result)) {
            result = escapedName + "_" + counter;
            counter++;
        }

        return result;
    }),
    setProfilePicture: api.export(async (session, abspath, picturePath) => {
        await api.vfs.unlink(session, path.join(abspath, "profilePicture"));
        await api.vfs.symlink(session, picturePath, path.join(abspath, "profilePicture"));
    })
});

module.exports = node;
