"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("mkuser <username>", "Create a new user")
.action(vorpal.wrap(function*(session, args) {
    let prompt = yield this.promptAsync({
        type: "input",
        name: "name",
        message: "Name: "
    });

    yield api.auth.mkuser(args.username, prompt.name);
}));
