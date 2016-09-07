"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("setattrib <name> <value> [path]", "Set node attribute")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(function*(session, args) {
    let cwd = yield session.env("cwd");
    let dir = args.path || cwd;
    let attributes = {};

    attributes[args.name] = args.value;

    yield api.vfs.setattributes(terminal.normalize(cwd, dir), attributes);
}));
