"use strict";

const client = require("../client");

module.exports = {
    description: "Change user password",
    help: "Usage: passwd [username]",
    execute: function*(session, params) {
        let password1 = yield session.password();
        let password2 = yield session.password("Confirm password");

        if (password1 !== password2) {
            session.stdout().write("Password does not match".red + "\n");
            return;
        }

        yield client.call("passwd", { username: params.username || session.env("username"), password: password1 });
        session.stdout().write("Password updated".green + "\n");
    }
};
