"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("setfacl <aclentry> <path>", "Set node ACL")
.option("-r", "Recursive setfacl")
.option("-b", "Remove all ACL entries")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(async (ctx, session, args) => {
    let cwd = await session.env("cwd");
    let abspath = terminal.normalize(cwd, args.path);

    if (args.options.b) {
        await api.vfs.setfacl(abspath, null, { recursive: args.options.r });
        return;
    }

    let ac = {};
    let [ what, name, modestr ] = args.aclentry.split(":");

    if (what === "u") {
        ac.uid = parseInt(name, 10);

        if (isNaN(ac.uid)) {
            ac.uid = await api.auth.uid(name);
        }
    } else if (what === "g") {
        ac.gid = parseInt(name, 10);

        if (isNaN(ac.gid)) {
            ac.gid = await api.auth.gid(name);
        }
    } else {
        throw new Error("Invalid aclentry, expected it to begin with u or g");
    }

    ac.mode = 0;

    if (modestr) {
        ac.mode |= modestr.includes("r") ? api.vfs.MASK_ACL_READ : 0;
        ac.mode |= modestr.includes("w") ? api.vfs.MASK_ACL_WRITE : 0;
        ac.mode |= modestr.includes("x") ? api.vfs.MASK_ACL_EXEC : 0;
    }

    await api.vfs.setfacl(abspath, ac, { recursive: args.options.r });
}));
