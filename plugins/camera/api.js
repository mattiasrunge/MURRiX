"use strict";

const path = require("path");
const api = require("api.io");
const bus = require("../../lib/bus");

const camera = api.register("camera", {
    deps: [ "vfs", "auth" ],
    init: async (/* config */) => {
        if (!(await api.vfs.resolve(api.auth.getAdminSession(), "/cameras", { noerror: true }))) {
            await api.vfs.create(api.auth.getAdminSession(), "/cameras", "d");
            await api.vfs.chown(api.auth.getAdminSession(), "/cameras", "admin", "users");
        }
    },
    mkcamera: api.export(async (session, name, attributes) => {
        const abspath = path.join("/cameras", name);

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
        return await api.vfs.resolve(session, `/cameras/${name}`, { noerror: true });
    }),
    findByLinks: api.export(async (session, abspath, opts = {}) => {
        console.time(`camera.findByTags total ${abspath}`);
        console.time("camera.findByTags sIds");

        const list = [];
        const cache = {};

        const options = {
            fields: {
                "_id": 1
            }
        };

        let query = {
            "properties.type": { $in: [ "s" ] },
            "attributes.path": abspath
        };

        // TODO: Should only get links names createdWith

        const sNodes = await api.vfs.query(session, query, options);
        const sIds = sNodes.map((node) => node._id);

        console.timeEnd("camera.findByTags sIds");
        console.time("camera.findByTags fNodes");

        query = {
            "properties.type": "f",
            "properties.children.id": { $in: sIds }
        };

        const fNodes = await api.vfs.query(session, query);

        console.timeEnd("camera.findByTags fNodes");
        console.time("camera.findByTags lookup");

        for (const node of fNodes) {
            const paths = await api.vfs.lookup(session, node._id, cache);

            list.push({ name: path.basename(paths[0]), node: node, path: paths[0] });
        }

        console.timeEnd("camera.findByTags lookup");
        console.timeEnd(`camera.findByTags total ${abspath}`);

        if (opts.image) {
            const ids = list.map((nodepath) => nodepath.node._id);

            const urls = await api.file.getMediaUrl(session, ids, opts.image);

            for (const nodepath of list) {
                nodepath.filename = urls[nodepath.node._id] || false;
            }
        }

        return list;
    })
});

module.exports = camera;
