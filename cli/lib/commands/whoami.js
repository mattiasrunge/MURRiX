"use strict";

module.exports = {
    description: "Shows current user",
    help: "Usage: whoami",
    execute: function*(session/*, params*/) {
        session.stdout().write(session.env("username") + "\n");
    }
};
