"use strict";

const client = require("../client");
const path = require("../path");

module.exports = {
    description: "Print node attributes",
    help: "Usage: attribs [path]",
    execute: function*(session, params) {
        let dir = params.path || session.env("cwd");
        let node = yield client.call("resolve", {
            abspath: path.normalize(session.env("cwd"), dir)
        });

        session.stdout().write(JSON.stringify(node.attributes, null, 2) + "\n");
    }
};
