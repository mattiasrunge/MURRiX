"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const vfs = require("../vfs");
const terminal = require("../terminal");

vorpal
.command("attribs [path]", "Print node attributes")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    let cwd = yield session.env("cwd");
    let abspath = args.path ? terminal.normalize(cwd, args.path) : cwd;

    let node = yield vfs.resolve(abspath);

    this.log(JSON.stringify(node.attributes, null, 2));
}));
