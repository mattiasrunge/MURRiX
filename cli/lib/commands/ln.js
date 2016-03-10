"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const client = require("../client");
const vfs = require("../vfs");

vorpal
.command("ln <srcpath> <destpath>", "Link a node")
.autocomplete({
    data: function(input) {
        return vfs.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    yield client.call("link", {
        srcpath: vfs.normalize(yield session.env("cwd"), args.srcpath),
        destpath: vfs.normalize(yield session.env("cwd"), args.destpath)
    });
}));
