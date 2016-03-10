"use strict";

const client = require("../client");
const path = require("../path");

module.exports = {
    description: "Change mode bits for node",
    help: "Usage: chmod <mode> <path>",
    execute: function*(session, params) {
        yield client.call("chmod", {
            abspath: path.normalize(session.env("cwd"), params.path),
            mode: params.mode
        });
    },
    completer: path.completer
};
