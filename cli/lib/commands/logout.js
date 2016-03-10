"use strict";

const client = require("../client");

module.exports = {
    description: "Logout",
    help: "Usage: logout",
    execute: function*(session, params) {
        let result = yield client.call("logout");

        if (result) {
            session.env("username", "guest");
        } else {
            session.stdout().write("Logout failed".red + "\n");
        }
    }
};
