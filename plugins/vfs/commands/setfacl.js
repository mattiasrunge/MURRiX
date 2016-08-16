"use strict";

const octal = require("octal");
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
.action(vorpal.wrap(function*(session, args) {
    let cwd = yield session.env("cwd");
    let abspath = terminal.normalize(cwd, args.path);

    if (args.options.b) {
        yield api.vfs.setfacl(abspath, null, { recursive: args.options.r });
        return;
    }

    let ac = {};
    let [ what, name, modestr ] = args.aclentry.split(":");

    if (what === "u") {
        ac.uid = parseInt(name, 10);

        if (isNaN(ac.uid)) {
            ac.uid = yield api.auth.uid(name);
        }
    } else if (what === "g") {
        ac.gid = parseInt(name, 10);

        if (isNaN(ac.gid)) {
            ac.gid = yield api.auth.gid(name);
        }
    } else {
        throw new Error("Invalid aclentry, expected it to begin with u or g");
    }

    ac.mode = 0;

    if (modestr) {
        if (modestr.indexOf("r") !== -1) {
            ac.mode += octal("004");
        }

        if (modestr.indexOf("w") !== -1) {
            ac.mode += octal("002");
        }

        if (modestr.indexOf("x") !== -1) {
            ac.mode += octal("001");
        }
    }

    yield api.vfs.setfacl(abspath, ac, { recursive: args.options.r });

}));
