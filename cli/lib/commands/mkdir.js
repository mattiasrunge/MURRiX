"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const client = require("../client");
const vfs = require("../vfs");

vorpal
.command("mkdir <path>", "Create a new directory node")
.action(vorpal.wrap(function*(args) {
    yield client.call("create", {
        abspath: vfs.normalize(yield session.env("cwd"), args.path),
        type: "d"
    });
}));
