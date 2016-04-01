"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("login <username>", "Login as user")
.action(vorpal.wrap(function*(session, args) {
    let prompt = yield this.promptAsync({
        type: "password",
        name: "password",
        message: "Password: "
    });

    let result = yield api.auth.login(args.username, prompt.password);

    if (!result) {
        throw new Error("Login failed");
    }

    yield session.env("username", args.username);

    let counts = yield api.message.count();

    this.log("Welcome " + args.username.bold + ", you have " + counts.unread.toString().bold + " new message(s)!");
}));
