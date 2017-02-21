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
.action(vorpal.wrap(async (ctx, session, args) => {
    let cwd = await session.env("cwd");

    if (args.path.includes("*")) {
        let list = await api.vfs.list(cwd);

        for (let item of list) {
            await api.vfs.unlink(item.path);
        }
    } else {
        await api.vfs.unlink(terminal.normalize(cwd, args.path));
    }
}));
