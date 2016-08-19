"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("rm <path>", "Remove a node")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(function*(session, args) {
    let cwd = yield session.env("cwd");

    if (args.path.includes("*")) {
        let list = yield api.vfs.list(cwd);

        for (let item of list) {
            yield api.vfs.unlink(item.path);
        }
    } else {
        yield api.vfs.unlink(terminal.normalize(cwd, args.path));
    }
}));
