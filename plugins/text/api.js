"use strict";

const co = require("bluebird").coroutine;
const api = require("api.io");
const chron = require("chron-time");
const plugin = require("../../core/lib/plugin");

let params = {};

let text = api.register("text", {
    deps: [ "vfs" ],
    init: co(function*(config) {
        params = config;
    }),
    mktext: function*(session, abspath, attributes) {
        yield api.vfs.create(session, abspath, "t", attributes);

        yield text.regenerate(session, abspath);

        plugin.emit("text.new", {
            uid: session.uid,
            path: abspath,
            text: attributes.text,
            type: attributes.type
        });

        return yield api.vfs.resolve(session, abspath);
    },
    regenerate: function*(session, abspath) {
        let node = yield api.vfs.resolve(session, abspath);
        let attributes = node.attributes;

        let time = chron.select(attributes.when || {});
        let timestamp = chron.time2timestamp(time);

        yield api.vfs.setattributes(session, node, {
            time: timestamp
        });
    }
});

module.exports = text;
