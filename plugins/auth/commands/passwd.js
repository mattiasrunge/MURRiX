"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("passwd [username]", "Change user password")
.action(vorpal.wrap(function*(session, args) {
    let username = args.username || (yield session.env("username"));
    let prompt1 = yield this.promptAsync({
        type: "password",
        name: "password",
        message: "New password: "
    });
    let prompt2 = yield this.promptAsync({
        type: "password",
        name: "password",
        message: "Confirm new password: "
    });

    if (prompt1.password !== prompt2.password) {
        throw new Error("Passwords do not match");
    }

    yield api.auth.passwd(username, prompt1.password);

    this.log("Password updated".green);
}));
