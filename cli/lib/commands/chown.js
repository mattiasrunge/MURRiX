"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const vfs = require("../vfs");
const terminal = require("../terminal");

vorpal
.command("chown <userstring> <path>", "Change owner and group for node")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    let cwd = yield session.env("cwd");

    yield vfs.chown(terminal.normalize(cwd, args.path), args.userstring);
}));
