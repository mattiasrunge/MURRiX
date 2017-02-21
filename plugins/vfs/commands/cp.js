"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("cp <srcpath> <destpath>", "Copy a node")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(async (ctx, session, args) => {
    let cwd = await session.env("cwd");

    await api.vfs.copy(terminal.normalize(cwd, args.srcpath), terminal.normalize(cwd, args.destpath));
}));
