"use strict";

const vorpal = require("../vorpal");
const vfs = require("../vfs");

vorpal
.command("mkuser <username>", "Create a new user")
.action(vorpal.wrap(function*(args) {
    let prompt = yield this.promptAsync({
        type: "input",
        name: "name",
        message: "Name: "
    });

    yield vfs.mkuser(args.username, prompt.name);
}));
