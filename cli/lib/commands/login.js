"use strict";

const client = require("../client");

module.exports = {
    description: "Login as user",
    help: "Usage: login <username>",
    execute: function*(session, params) {
        let password = yield session.password();
        let result = yield client.call("login", { username: params.username, password: password });

        if (result) {
            session.env("username", params.username);
        } else {
            session.stdout().write("Login failed".red + "\n");
        }
    }
};
