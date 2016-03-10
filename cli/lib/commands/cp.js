"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const client = require("../client");
const vfs = require("../vfs");

vorpal
.command("cp <srcpath> <destpath>", "Copy a node")
.autocomplete({
    data: function(input) {
        return vfs.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    yield client.call("copy", {
        srcpath: vfs.normalize(yield session.env("cwd"), args.srcpath),
        destpath: vfs.normalize(yield session.env("cwd"), args.destpath)
    });
}));
