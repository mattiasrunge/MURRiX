"use strict";

const path = require("path");
const api = require("api.io");
const bus = require("../../lib/bus");

const location = api.register("location", { // jshint ignore:line
    deps: [ "vfs", "auth", "file" ],
    init: async (/* config */) => {
        if (!(await cmd.resolve(api.auth.getAdminSession(), "/locations", { noerror: true }))) {
            await cmd.create(api.auth.getAdminSession(), "/locations", "d");
            await cmd.chown(api.auth.getAdminSession(), "/locations", "admin", "users");
        }
    },
    mklocation: api.export(async (session, name, attributes) => {
        const abspath = path.join("/locations", name);

        await cmd.create(session, abspath, "l", attributes);

        await cmd.create(session, path.join(abspath, "residents"), "d");
        await cmd.create(session, path.join(abspath, "texts"), "d");

        bus.emit("location.new", {
            uid: session.uid,
            path: abspath,
            name: attributes.name
        });

        return await cmd.resolve(session, abspath);
    }),
    find: api.export(async (session, name) => {
        return await cmd.resolve(session, `/locations/${name}`, { noerror: true });
    }),
    findByLinks: api.export(async (session, abspath, opts = {}) => {
        console.time(`location.findByTags total ${abspath}`);
        console.time("location.findByTags sIds");

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

        // TODO: Should only get links names location

        const sNodes = await cmd.query(session, query, options);
        const sIds = sNodes.map((node) => node._id);

        console.timeEnd("location.findByTags sIds");
        console.time("location.findByTags fNodes");

        query = {
            "properties.type": "f",
            "properties.children.id": { $in: sIds }
        };

        const fNodes = await cmd.query(session, query);

        console.timeEnd("location.findByTags fNodes");
        console.time("location.findByTags lookup");

        for (const node of fNodes) {
            const paths = await cmd.lookup(session, node._id, cache);

            list.push({ name: path.basename(paths[0]), node: node, path: paths[0] });
        }

        console.timeEnd("location.findByTags lookup");
        console.timeEnd(`location.findByTags total ${abspath}`);

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

module.exports = location;
