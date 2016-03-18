"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const api = require("api.io").client;
const terminal = require("../terminal");

vorpal
.command("cd <path>", "Change directory")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    let abspath = terminal.normalize(yield session.env("cwd"), args.path);

    let access = yield api.vfs.access(abspath, "x");

    if (!access) {
        throw new Error("Permission denied");
    }

    let node = yield api.vfs.resolve(abspath);

    if (!node) {
        throw new Error("Invalid path " + abspath);
    }

    yield session.env("cwd", abspath);
}));
