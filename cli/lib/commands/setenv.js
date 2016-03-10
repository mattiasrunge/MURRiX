"use strict";

module.exports = {
    description: "Set an environment variable",
    help: "Usage: setenv <name> <value>",
    execute: function*(session, params) {
        session.env(params.name, params.value);
    }
};
