"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("props [path]", "Print node properties")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(async (ctx, session, args) => {
    let cwd = await session.env("cwd");
    let abspath = args.path ? terminal.normalize(cwd, args.path) : cwd;

    let node = await api.vfs.resolve(abspath);

    ctx.log(JSON.stringify(node.properties, null, 2));
}));
