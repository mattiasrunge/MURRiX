"use strict";

const client = require("../client");
const path = require("../path");

module.exports = {
    description: "Change owner and group for node",
    help: "Usage: chown <username> <path>",
    execute: function*(session, params) {
        let username = params.username;
        let group = false;

        if (username.indexOf(":") !== -1) {
            let parts = username.split(":");
            username = parts[0];
            group = parts[1];
        }

        yield client.call("chown", {
            abspath: path.normalize(session.env("cwd"), params.path),
            username: username,
            group: group
        });
    },
    completer: path.completer
};
