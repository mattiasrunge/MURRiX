"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const api = require("api.io").client;
const expandvar = require("expand-var");
const fs = require("fs-extra-promise");
const vorpal = require("./vorpal");

const sessionIdFilename = path.join(process.env.HOME, ".murrix", "cli.sessionId");

module.exports = {
    environment: {
        username: "guest",
        cwd: "/",
        ps1: "\u001b[32m$username\u001b[39m \u001b[1m$cwd ]\u001b[22m"
    },
    session: {},
    init: co(function*() {
        let session = yield api.auth.session();

        if (session.sessionId) {
            yield fs.outputFileAsync(sessionIdFilename, session.sessionId, {
                mode: 0o700
            });
        }

        yield module.exports.env("username", session.username);
    }),
    readSessionId: co(function*() {
        try {
            let sessionId = yield fs.readFileAsync(sessionIdFilename);
            return sessionId.toString();
        } catch (e) {
        }
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

// TODO: This is somewhat of a hack, figure out something better
vorpal.cliSession = module.exports;
