"use strict";

const vorpal = require("../vorpal");
const client = require("../client");

vorpal
.command("mkgroup <name>", "Create a new group")
.action(vorpal.wrap(function*(args) {
    let prompt = yield this.promptAsync({
        type: "input",
        name: "name",
        message: "Name: "
    });

    yield client.call("create", {
        abspath: "/groups/" + args.name,
        type: "g",
        attributes: {
            name: prompt.name
        }
    });
}));
