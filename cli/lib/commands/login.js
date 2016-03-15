"use strict";

const vorpal = require("../vorpal");
const vfs = require("../vfs");
const session = require("../session");

vorpal
.command("login <username>", "Login as user")
.action(vorpal.wrap(function*(args) {
    let prompt = yield this.promptAsync({
        type: "password",
        name: "password",
        message: "Password: "
    });

    let result = yield vfs.login(args.username, prompt.password);

    if (!result) {
        throw new Error("Login failed");
    }

    yield session.env("username", args.username);

    let messages = yield vfs.list("/users/" + args.username + "/new_messages");

    this.log("Welcome " + args.username.bold + ", you have " + messages.length.toString().bold + " new message(s)!");
}));
