"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const vfs = require("../vfs");
const terminal = require("../terminal");

vorpal
.command("setattrib <name> <value> [path]", "Set node attribute")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    let cwd = yield session.env("cwd");
    let dir = args.path || cwd;
    let attributes = {};

    attributes[args.name] = args.value;

    yield vfs.setAttributes(terminal.normalize(cwd, dir), attributes);
}));
