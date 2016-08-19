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
.action(vorpal.wrap(function*(session, args) {
    let cwd = yield session.env("cwd");
    let node = yield api.vfs.resolve(terminal.normalize(cwd, args.path), { nofollow: true });

    this.log("# file: " + args.path);
    this.log("# owner: " + (yield api.auth.uname(node.properties.uid)));
    this.log("# group: " + (yield api.auth.gname(node.properties.gid)));

    this.log("user::" + terminal.modeString(node.properties.mode, { owner: true }));

    if (node.properties.acl && node.properties.acl.length > 0) {
        for (let ac of node.properties.acl) {
            if (ac.uid) {
                this.log("user:" + (yield api.auth.uname(ac.uid)) + ":" + terminal.modeString(ac.mode, { acl: true }));
            }
        }
    }

    this.log("group::" + terminal.modeString(node.properties.mode, { group: true }));

    if (node.properties.acl && node.properties.acl.length > 0) {
        for (let ac of node.properties.acl) {
            if (ac.gid) {
                this.log("group:" + (yield api.auth.gname(ac.gid)) + ":" + terminal.modeString(ac.mode, { acl: true }));
            }
        }
    }

    this.log("other::" + terminal.modeString(node.properties.mode, { other: true }));
}));
