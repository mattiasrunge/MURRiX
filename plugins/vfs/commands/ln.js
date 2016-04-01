"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("ln <srcpath> <destpath>", "Link a node")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(function*(session, args) {
    let cwd = yield session.env("cwd");

    yield api.vfs.link(terminal.normalize(cwd, args.srcpath), terminal.normalize(cwd, args.destpath));
}));
