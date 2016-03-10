"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const client = require("../client");
const vfs = require("../vfs");

vorpal
.command("chmod <mode> <path>", "Change mode bits for node")
.autocomplete({
    data: function(input) {
        return vfs.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    yield client.call("chmod", {
        abspath: vfs.normalize(yield session.env("cwd"), args.path),
        mode: args.mode
    });
}));
