"use strict";

const path = require("path");
const api = require("api.io");
const bus = require("../../core/lib/bus");
const log = require("../../core/lib/log")(module);

let params = {};

const album = api.register("album", {
    deps: [ "vfs", "auth" ],
    init: async (config) => {
        params = config;

        if (!(await api.vfs.resolve(api.auth.getAdminSession(), "/albums", { noerror: true }))) {
            await api.vfs.create(api.auth.getAdminSession(), "/albums", "d");
            await api.vfs.chown(api.auth.getAdminSession(), "/albums", "admin", "users");
            await api.vfs.chmod(api.auth.getAdminSession(), "/albums", 0o771);
        }
    },
    mkalbum: api.export(async (session, name, attributes) => {
        let abspath = path.join("/albums", name);

        await api.vfs.create(session, abspath, "a", attributes);
        await api.vfs.chmod(session, abspath, 0o750);

        await api.vfs.create(session, path.join(abspath, "files"), "d");
        await api.vfs.create(session, path.join(abspath, "texts"), "d");

        bus.emit("album.new", {
            uid: session.uid,
            path: abspath,
            name: attributes.name
        });

        return await api.vfs.resolve(session, abspath);
    }),
    find: api.export(async (session, name) => {
        return await api.vfs.resolve(session, "/albums/" + name, { noerror: true });
    })
});

module.exports = album;
