"use strict";

const client = require("../client");
const path = require("../path");

module.exports = {
    description: "Change directory",
    help: "Usage: cd <path>",
    execute: function*(session, params) {
        let abspath = path.normalize(session.env("cwd"), params.path);

        let access = yield client.call("access", {
            abspath: abspath,
            modestr: "x"
        });

        if (!access) {
            session.stdout().write(("Permission denied").red + "\n");
            return;
        }

        let node = yield client.call("resolve", {
            abspath: abspath
        });

        if (!node) {
            session.stdout().write(("Invalid path " + abspath).red + "\n");
        } else {
            session.env("cwd", abspath);
        }
    },
    completer: path.completer
};
