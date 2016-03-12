"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const vfs = require("../vfs");
const terminal = require("../terminal");

vorpal
.command("mkdir <path>", "Create a new directory node")
.action(vorpal.wrap(function*(args) {
    let cwd = yield session.env("cwd");

    yield vfs.create(terminal.normalize(cwd, args.path), "d");
}));
