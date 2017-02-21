"use strict";

const api = require("api.io");
const chron = require("chron-time");
const bus = require("../../core/lib/bus");

let params = {};

const text = api.register("text", {
    deps: [ "vfs" ],
    init: async (config) => {
        params = config;
    },
    mktext: api.export(async (session, abspath, attributes) => {
        await api.vfs.create(session, abspath, "t", attributes);

        await text.regenerate(session, abspath);

        bus.emit("text.new", {
            uid: session.uid,
            path: abspath,
            text: attributes.text,
            type: attributes.type
        });

        return await api.vfs.resolve(session, abspath);
    }),
    regenerate: api.export(async (session, abspath) => {
        let node = await api.vfs.resolve(session, abspath);

        let source = chron.select(node.attributes.when || {});

        if (source) {
            let timestamp = chron.time2timestamp(source.time, { type: source.type });

            await api.vfs.setattributes(session, node, {
                time: timestamp
            });
        }
    })
});

module.exports = text;
