"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const bus = require("../../core/lib/bus");
const log = require("../../core/lib/log")(module);

let params = {};

let album = api.register("album", {
    deps: [ "vfs", "auth" ],
    init: co(function*(config) {
        params = config;

        if (!(yield api.vfs.resolve(api.auth.getAdminSession(), "/albums", { noerror: true }))) {
            yield api.vfs.create(api.auth.getAdminSession(), "/albums", "d");
            yield api.vfs.chown(api.auth.getAdminSession(), "/albums", "admin", "users");
            yield api.vfs.chmod(api.auth.getAdminSession(), "/albums", 0o771);
        }
    }),
    mkalbum: function*(session, name, attributes) {
        let abspath = path.join("/albums", name);

        yield api.vfs.create(session, abspath, "a", attributes);
        yield api.vfs.chmod(session, abspath, 0o750);

        yield api.vfs.create(session, path.join(abspath, "files"), "d");
        yield api.vfs.create(session, path.join(abspath, "texts"), "d");

        bus.emit("album.new", {
            uid: session.uid,
            path: abspath,
            name: attributes.name
        });

        return yield api.vfs.resolve(session, abspath);
    },
    find: function*(session, name) {
        return yield api.vfs.resolve(session, "/albums/" + name, { noerror: true });
    }
});

module.exports = album;
