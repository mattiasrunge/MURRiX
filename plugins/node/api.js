"use strict";

const path = require("path");
const api = require("api.io");

const node = api.register("node", {
    deps: [ "vfs" ],
    init: async () => {},
    setProfilePicture: api.export(async (session, abspath, picturePath) => {
        await api.vfs.unlink(session, path.join(abspath, "profilePicture"));
        await api.vfs.symlink(session, picturePath, path.join(abspath, "profilePicture"));
    })
});

module.exports = node;
