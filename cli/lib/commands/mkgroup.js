"use strict";

const vorpal = require("../vorpal");
const vfs = require("../vfs");

vorpal
.command("mkgroup <name>", "Create a new group")
.action(vorpal.wrap(function*(args) {
    let prompt = yield this.promptAsync({
        type: "input",
        name: "name",
        message: "Name: "
    });

    yield vfs.mkgroup(args.name, prompt.name);
}));
