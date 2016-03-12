"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const vfs = require("../vfs");
const terminal = require("../terminal");

vorpal
.command("rm <path>", "Remove a node")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    let cwd = yield session.env("cwd");

    yield vfs.unlink(terminal.normalize(cwd, args.path));
}));
