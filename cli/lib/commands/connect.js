"use strict";

const client = require("../client");
const co = require("bluebird").coroutine;

module.exports = {
    description: "Connect to server",
    help: "Usage: connect [hostname]",
    load: function*(session) {
        return co(module.exports.execute)(session, []);
    },
    execute: function*(session, params) {
        params.hostname = params.hostname || "ws://127.0.0.1:8080";

        yield client.connect(params.hostname);

        let env = yield client.call("session");

        for (let name of Object.keys(env)) {
            session.env(name, env[name]);
        }

        session.stdout().write(("Successfully connected to " + params.hostname).green + "\n");
    }
};
