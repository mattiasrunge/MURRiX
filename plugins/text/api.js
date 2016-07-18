"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const fs = require("fs-extra-promise");
const moment = require("moment");
const api = require("api.io");
const vfs = require("../vfs/api");
const auth = require("../auth/api");
const mcs = require("../mcs/api");

let params = {};

let text = api.register("text", {
    deps: [ "vfs", "auth", "mcs" ],
    init: co(function*(config) {
        params = config;
    }),
    mktext: function*(session, abspath, attributes) {
        yield vfs.create(session, abspath, "t", attributes);

        yield text.regenerate(session, abspath);

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