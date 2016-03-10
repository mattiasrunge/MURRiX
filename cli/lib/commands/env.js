"use strict";

module.exports = {
    description: "List all environment variables",
    help: "Usage: env",
    execute: function*(session, params) {
        for (let name of Object.keys(session._env)) {
            if (typeof session.env(name) === "string") {
                session.stdout().write(name + "=" + session.env(name) + "\n");
            }
        }
    }
};
