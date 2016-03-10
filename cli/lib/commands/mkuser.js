"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const client = require("../client");
const vfs = require("../vfs");

vorpal
.command("mkuser <username>", "Create a new user")
.action(vorpal.wrap(function*(args) {
    let prompt = yield this.promptAsync({
        type: "input",
        name: "name",
        message: "Name: ",
    });

    let group = yield client.call("create", {
        abspath: "/groups/" + args.username,
        type: "g",
        attributes: {
            name: prompt.name
        }
    });

    yield client.call("create", {
        abspath: "/users/" + args.username,
        type: "u",
        attributes: {
            gid: group.attributes.gid,
            name: prompt.name
        }
    });

    yield client.call("link", {
        srcpath: "/groups/" + args.username,
        destpath: "/users/" + args.username
    });

    yield client.call("link", {
        srcpath: "/users/" + args.username,
        destpath: "/groups/" + args.username
    });
}));
