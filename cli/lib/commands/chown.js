"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const client = require("../client");
const vfs = require("../vfs");

vorpal
.command("chown <username> <path>", "Change owner and group for node")
.autocomplete({
    data: function(input) {
        return vfs.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    let username = args.username;
    let group = false;

    if (username.indexOf(":") !== -1) {
        let parts = username.split(":");
        username = parts[0];
        group = parts[1];
    }

    yield client.call("chown", {
        abspath: vfs.normalize(yield session.env("cwd"), args.path),
        username: username,
        group: group
    });
}));
