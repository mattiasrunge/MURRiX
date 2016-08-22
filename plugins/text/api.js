"use strict";

const co = require("bluebird").coroutine;
const api = require("api.io");
const plugin = require("../../core/lib/plugin");
const vfs = require("../vfs/api");
const mcs = require("../../core/lib/mcs");

let params = {};

let text = api.register("text", {
    deps: [ "vfs" ],
    init: co(function*(config) {
        params = config;
    }),
    mktext: function*(session, abspath, attributes) {
        yield vfs.create(session, abspath, "t", attributes);

        yield text.regenerate(session, abspath);

        plugin.emit("text.new", {
            uid: session.uid,
            path: abspath,
            text: attributes.text,
            type: attributes.type
        });

        return yield vfs.resolve(session, abspath);
    },
    regenerate: function*(session, abspath) {
        let node = yield vfs.resolve(session, abspath);
        let attributes = node.attributes;

        yield vfs.setattributes(session, node, {
            time: yield mcs.compileTime(attributes.when || {})
        });
    }
});

module.exports = text;
