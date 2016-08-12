"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const api = require("api.io");
const plugin = require("../../core/lib/plugin");
const vfs = require("../vfs/api");
const auth = require("../auth/api");

let params = {};

let camera = api.register("camera", {
    deps: [ "vfs", "auth" ],
    init: co(function*(config) {
        params = config;

        if (!(yield vfs.resolve(auth.getAdminSession(), "/cameras", { noerror: true }))) {
            yield vfs.create(auth.getAdminSession(), "/cameras", "d");
            yield vfs.chown(auth.getAdminSession(), "/cameras", "admin", "users");
        }
    }),
    mkcamera: function*(session, name, attributes) {
        let abspath = path.join("/cameras", name);

        attributes = attributes || {};

        attributes.type = attributes.type || "offset_fixed";
        attributes.utcOffset = attributes.utcOffset || 0;
        attributes.offsetDescription = attributes.offsetDescription || "";
        attributes.deviceAutoDst = attributes.deviceAutoDst || false;
        attributes.serialNumber = attributes.serialNumber || "";

        yield vfs.create(session, abspath, "c", attributes);
        yield vfs.create(session, path.join(abspath, "owners"), "d");

        plugin.emit("camera.new", {
            uid: session.uid,
            path: abspath,
            name: attributes.name
        });

        return yield vfs.resolve(session, abspath);
    },
    find: function*(session, name) {
        return yield vfs.resolve(session, "/cameras/" + name, { noerror: true });
    }
});

module.exports = camera;
