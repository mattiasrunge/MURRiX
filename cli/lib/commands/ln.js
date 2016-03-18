"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const api = require("api.io").client;
const terminal = require("../terminal");

vorpal
.command("ln <srcpath> <destpath>", "Link a node")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    let cwd = yield session.env("cwd");

    yield api.vfs.link(terminal.normalize(cwd, args.srcpath), terminal.normalize(cwd, args.destpath));
}));
