"use strict";

const co = require("bluebird").coroutine;
const expandvar = require("expand-var");
const api = require("api.io").client;
const vorpal = require("./vorpal");

module.exports = {
    environment: {
        username: "guest",
        cwd: "/",
        ps1: "\u001b[32m$username\u001b[39m \u001b[1m$cwd ]\u001b[22m"
    },
    session: {},
    init: co(function*() {
        let session = yield api.auth.session();

        yield module.exports.env("username", session.username);
    }),
    env: co(function*(name, value) {
        if (value) {
            if (value === null) {
                delete module.exports.environment[name];
            } else {
                module.exports.environment[name] = value;
            }

            if (name === "cwd" || name === "username" || name === "ps1") {
                module.exports.refreshPrompt();
            }
        }

        return module.exports.environment[name];
    }),
    get: co(function*(name) {
        return module.exports.session[name];
    }),
    set: co(function*(name, value) {
        module.exports.session[name] = value;
    }),
    expand: (str) => {
        return expandvar(str, module.exports.environment);
    },
    refreshPrompt: () => {
        vorpal.delimiter(module.exports.expand(module.exports.environment.ps1));
    }
};
