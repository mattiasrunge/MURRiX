"use strict";

const path = require("path");
const api = require("api.io");
const bus = require("../../core/lib/bus");

let params = {};

const camera = api.register("camera", {
    deps: [ "vfs", "auth" ],
    init: async (config) => {
        params = config;

        if (!(await api.vfs.resolve(api.auth.getAdminSession(), "/cameras", { noerror: true }))) {
            await api.vfs.create(api.auth.getAdminSession(), "/cameras", "d");
            await api.vfs.chown(api.auth.getAdminSession(), "/cameras", "admin", "users");
        }
    },
    mkcamera: api.export(async (session, name, attributes) => {
        let abspath = path.join("/cameras", name);

        attributes = attributes || {};

        attributes.type = attributes.type || "offset_fixed";
        attributes.utcOffset = attributes.utcOffset || 0;
        attributes.offsetDescription = attributes.offsetDescription || "";
        attributes.deviceAutoDst = attributes.deviceAutoDst || false;
        attributes.serialNumber = attributes.serialNumber || "";

        await api.vfs.create(session, abspath, "c", attributes);
        await api.vfs.create(session, path.join(abspath, "owners"), "d");

        bus.emit("camera.new", {
            uid: session.uid,
            path: abspath,
            name: attributes.name
        });

        return await api.vfs.resolve(session, abspath);
    }),
    find: api.export(async (session, name) => {
        return await api.vfs.resolve(session, "/cameras/" + name, { noerror: true });
    })
});

module.exports = camera;
