"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("chmod <mode> <path>", "Change mode bits for node")
.option("-r", "Recursive chmod")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(function*(session, args) {
    let cwd = yield session.env("cwd");
    let options = {};

    if (args.options.r) {
        options.recursive = true;
    }

    yield api.vfs.chmod(terminal.normalize(cwd, args.path), parseInt(args.mode, 8), options);
}));
