"use strict";

const client = require("../client");
const path = require("../path");

module.exports = {
    description: "Create a new directory node",
    help: "Usage: mkdir <path>",
    execute: function*(session, params) {
        yield client.call("create", {
            abspath: path.normalize(session.env("cwd"), params.path),
            type: "d"
        });
    },
    completer: path.completer
};
