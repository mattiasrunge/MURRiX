"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("symlink <srcpath> <destpath>", "Symlink a node")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(function*(session, args) {
    let cwd = yield session.env("cwd");

    yield api.vfs.symlink(terminal.normalize(cwd, args.srcpath), terminal.normalize(cwd, args.destpath));
}));
