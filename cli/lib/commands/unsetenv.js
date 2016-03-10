"use strict";

module.exports = {
    description: "Unset an environment variable",
    help: "Usage: unsetenv <name>",
    execute: function*(session, params) {
        session.env(params.name, false);
    }
};
