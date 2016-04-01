"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("mkgroup <name>", "Create a new group")
.action(vorpal.wrap(function*(session, args) {
    let prompt = yield this.promptAsync({
        type: "input",
        name: "name",
        message: "Name: "
    });

    yield api.auth.mkgroup(args.name, prompt.name);
}));
