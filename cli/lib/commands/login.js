"use strict";

const vorpal = require("../vorpal");
const api = require("api.io").client;
const session = require("../session");

vorpal
.command("login <username>", "Login as user")
.action(vorpal.wrap(function*(args) {
    let prompt = yield this.promptAsync({
        type: "password",
        name: "password",
        message: "Password: "
    });

    let result = yield api.vfs.login(args.username, prompt.password);

    if (!result) {
        throw new Error("Login failed");
    }

    yield session.env("username", args.username);

    let messages = yield api.vfs.list("/users/" + args.username + "/new_messages");

    this.log("Welcome " + args.username.bold + ", you have " + messages.length.toString().bold + " new message(s)!");
}));
