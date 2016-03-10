"use strict";

const client = require("../client");
const path = require("../path");

module.exports = {
    description: "Remove a node",
    help: "Usage: rm <path>",
    execute: function*(session, params) {
        yield client.call("unlink", {
            abspath: path.normalize(session.env("cwd"), params.path)
        });
    },
    completer: path.completer
};
