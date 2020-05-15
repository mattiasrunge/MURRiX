"use strict";

const path = require("path");
const api = require("api.io").getClient();
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
    init: async () => {
        let session = await api.auth.session();

        if (session._id) {
            await fs.outputFileAsync(sessionIdFilename, session._id, {
                mode: 0o700
            });
        }

        await module.exports.env("username", session.username);
    },
    readSessionId: async () => {
        try {
            let sessionId = await fs.readFileAsync(sessionIdFilename);
            return sessionId.toString();
        } catch (e) {
        }
    },
    env: async (name, value) => {
        if (value) {
            if (value === null) {
                delete module.exports.environment[name];
            } else if (name === "cwd") {
                module.exports.environment[name] = value.length > 1 && value[value.length - 1] === "/" ? value.slice(0, value.length - 1) : value;
            } else {
                module.exports.environment[name] = value;
            }

            if (name === "cwd" || name === "username" || name === "ps1") {
                module.exports.refreshPrompt();
            }
        }

        return module.exports.environment[name];
    },
    get: async (name) => {
        return module.exports.session[name];
    },
    set: async (name, value) => {
        module.exports.session[name] = value;
    },
    expand: (str) => {
        return expandvar(str, module.exports.environment);
    },
    refreshPrompt: () => {
        vorpal.delimiter(module.exports.expand(module.exports.environment.ps1));
    }
};

// TODO: This is somewhat of a hack, figure out something better
vorpal.cliSession = module.exports;
