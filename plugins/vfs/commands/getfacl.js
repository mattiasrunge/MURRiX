"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("getfacl <path>", "Print node ACL")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(async (ctx, session, args) => {
    let cwd = await session.env("cwd");
    let node = await api.vfs.resolve(terminal.normalize(cwd, args.path), { nofollow: true });

    ctx.log("# file: " + args.path);
    ctx.log("# owner: " + (await api.auth.uname(node.properties.uid)));
    ctx.log("# group: " + (await api.auth.gname(node.properties.gid)));

    ctx.log("user::" + terminal.modeString(node.properties.mode, { owner: true }));

    if (node.properties.acl && node.properties.acl.length > 0) {
        for (let ac of node.properties.acl) {
            if (ac.uid) {
                ctx.log("user:" + (await api.auth.uname(ac.uid)) + ":" + terminal.modeString(ac.mode, { acl: true }));
            }
        }
    }

    ctx.log("group::" + terminal.modeString(node.properties.mode, { group: true }));

    if (node.properties.acl && node.properties.acl.length > 0) {
        for (let ac of node.properties.acl) {
            if (ac.gid) {
                ctx.log("group:" + (await api.auth.gname(ac.gid)) + ":" + terminal.modeString(ac.mode, { acl: true }));
            }
        }
    }

    ctx.log("other::" + terminal.modeString(node.properties.mode, { other: true }));
}));
