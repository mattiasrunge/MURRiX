"use strict";

const vorpal = require("../vorpal");
const client = require("../client");
const session = require("../session");

vorpal
.command("login <username>", "Login as user")
.action(vorpal.wrap(function*(args) {
    let prompt = yield this.promptAsync({
        type: "password",
        name: "password",
        message: "Password: "
    });

    let result = yield client.call("login", { username: args.username, password: prompt.password });

    if (!result) {
        throw new Error("Login failed");
    }

    yield session.env("username", args.username);
}));
