"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const api = require("api.io");
const plugin = require("../../core/lib/plugin");
const vfs = require("../vfs/api");
const auth = require("../auth/api");

let params = {};

let location = api.register("location", { // jshint ignore:line
    deps: [ "vfs", "auth" ],
    init: co(function*(config) {
        params = config;

        if (!(yield vfs.resolve(auth.getAdminSession(), "/locations", { noerror: true }))) {
            yield vfs.create(auth.getAdminSession(), "/locations", "d");
            yield vfs.chown(auth.getAdminSession(), "/locations", "admin", "users");
        }
    }),
    mklocation: function*(session, name, attributes) {
        let abspath = path.join("/locations", name);

        yield vfs.create(session, abspath, "l", attributes);

        yield vfs.create(session, path.join(abspath, "residents"), "d");
        yield vfs.create(session, path.join(abspath, "texts"), "d");

        plugin.emit("location.new", {
            uid: session.uid,
            path: abspath,
            name: attributes.name
        });

        return yield vfs.resolve(session, abspath);
    },
    find: function*(session, name) {
        return yield vfs.resolve(session, "/locations/" + name, { noerror: true });
    }
});

module.exports = location;
