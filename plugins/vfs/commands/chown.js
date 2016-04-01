"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("chown <userstring> <path>", "Change owner and group for node")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(function*(session, args) {
    let cwd = yield session.env("cwd");
    let group = false;
    let username = args.userstring;

    if (args.userstring.indexOf(":") !== -1) {
        let parts = args.userstring.split(":");
        username = parts[0];
        group = parts[1];
    }

    yield api.vfs.chown(terminal.normalize(cwd, args.path), username, group);
}));
