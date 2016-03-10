"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const client = require("../client");
const vfs = require("../vfs");

vorpal
.command("mv <srcpath> <destpath>", "Move a node")
.autocomplete({
    data: function(input) {
        return vfs.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    yield client.call("move", {
        srcpath: vfs.normalize(yield session.env("cwd"), args.srcpath),
        destpath: vfs.normalize(yield session.env("cwd"), args.destpath)
    });
}));
