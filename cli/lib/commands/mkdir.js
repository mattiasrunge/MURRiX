"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const api = require("api.io").client;
const terminal = require("../terminal");

vorpal
.command("mkdir <path>", "Create a new directory node")
.action(vorpal.wrap(function*(args) {
    let cwd = yield session.env("cwd");

    yield api.vfs.create(terminal.normalize(cwd, args.path), "d");
}));
