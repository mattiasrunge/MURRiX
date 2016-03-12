"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const vfs = require("../vfs");
const terminal = require("../terminal");

vorpal
.command("mv <srcpath> <destpath>", "Move a node")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    let cwd = yield session.env("cwd");

    yield vfs.move(terminal.normalize(cwd, args.srcpath), terminal.normalize(cwd, args.destpath));
}));
