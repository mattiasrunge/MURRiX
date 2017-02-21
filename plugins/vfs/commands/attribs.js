"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("attribs [path]", "Print node attributes")
.option("-l", "Don't follow links")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(async (ctx, session, args) => {
    let cwd = await session.env("cwd");
    let abspath = args.path ? terminal.normalize(cwd, args.path) : cwd;

    let node = await api.vfs.resolve(abspath, { nofollow: args.options.l });

    ctx.log(JSON.stringify(node.attributes, null, 2));
}));
