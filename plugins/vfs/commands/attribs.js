"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("attribs [path]", "Print node attributes")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(function*(session, args) {
    let cwd = yield session.env("cwd");
    let abspath = args.path ? terminal.normalize(cwd, args.path) : cwd;

    let node = yield api.vfs.resolve(abspath);

    this.log(JSON.stringify(node.attributes, null, 2));
}));
