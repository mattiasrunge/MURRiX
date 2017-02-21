"use strict";

const path = require("path");
const api = require("api.io");
const bus = require("../../core/lib/bus");

let params = {};

let location = api.register("location", { // jshint ignore:line
    deps: [ "vfs", "auth" ],
    init: async (config) => {
        params = config;

        if (!(await api.vfs.resolve(api.auth.getAdminSession(), "/locations", { noerror: true }))) {
            await api.vfs.create(api.auth.getAdminSession(), "/locations", "d");
            await api.vfs.chown(api.auth.getAdminSession(), "/locations", "admin", "users");
        }
    },
    mklocation: api.export(async (session, name, attributes) => {
        let abspath = path.join("/locations", name);

        await api.vfs.create(session, abspath, "l", attributes);

        await api.vfs.create(session, path.join(abspath, "residents"), "d");
        await api.vfs.create(session, path.join(abspath, "texts"), "d");

        bus.emit("location.new", {
            uid: session.uid,
            path: abspath,
            name: attributes.name
        });

        return await api.vfs.resolve(session, abspath);
    }),
    find: api.export(async (session, name) => {
        return await api.vfs.resolve(session, "/locations/" + name, { noerror: true });
    })
});

module.exports = location;
