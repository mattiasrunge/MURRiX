"use strict";

module.exports = {
    description: "Shows current location",
    help: "Usage: cwd",
    execute: function*(session/*, params*/) {
        session.stdout().write(session.env("cwd") + "\n");
    }
};
