"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const api = require("api.io");
const bus = require("../../core/lib/bus");

let params = {};

let location = api.register("location", { // jshint ignore:line
    deps: [ "vfs", "auth" ],
    init: co(function*(config) {
        params = config;

        if (!(yield api.vfs.resolve(api.auth.getAdminSession(), "/locations", { noerror: true }))) {
            yield api.vfs.create(api.auth.getAdminSession(), "/locations", "d");
            yield api.vfs.chown(api.auth.getAdminSession(), "/locations", "admin", "users");
        }
    }),
    mklocation: function*(session, name, attributes) {
        let abspath = path.join("/locations", name);

        yield api.vfs.create(session, abspath, "l", attributes);

        yield api.vfs.create(session, path.join(abspath, "residents"), "d");
        yield api.vfs.create(session, path.join(abspath, "texts"), "d");

        bus.emit("location.new", {
            uid: session.uid,
            path: abspath,
            name: attributes.name
        });

        return yield api.vfs.resolve(session, abspath);
    },
    find: function*(session, name) {
        return yield api.vfs.resolve(session, "/locations/" + name, { noerror: true });
    }
});

module.exports = location;
