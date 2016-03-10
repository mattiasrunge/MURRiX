"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const client = require("../client");
const vfs = require("../vfs");

vorpal
.command("cd <path>", "Change directory")
.autocomplete({
    data: function(input) {
        return vfs.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    let abspath = vfs.normalize(yield session.env("cwd"), args.path);

    let access = yield client.call("access", {
        abspath: abspath,
        modestr: "x"
    });

    if (!access) {
        throw new Error("Permission denied");
    }

    let node = yield client.call("resolve", {
        abspath: abspath
    });

    if (!node) {
        throw new Error("Invalid path " + abspath);
    }

    yield session.env("cwd", abspath);
}));
