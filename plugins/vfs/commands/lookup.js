"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("lookup [path]", "Print node parent paths")
.option("-l", "Don't follow links")
.option("-i", "Path is an id")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(async (ctx, session, args) => {
    let cwd = await session.env("cwd");
    let id;

    if (!args.options.i) {
        let abspath = args.path ? terminal.normalize(cwd, args.path) : cwd;
        let node = await api.vfs.resolve(abspath, { nofollow: args.options.l });

        id = node._id;
    } else {
        id = args.path;
    }

    let paths = await api.vfs.lookup(id);

    for (let path of paths) {
        ctx.log(path);
    }
}));
