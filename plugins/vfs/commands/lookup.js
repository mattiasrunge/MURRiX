"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("lookup [path]", "Print node parent paths")
.option("-l", "Don't follow links")
.autocomplete({
    data: function(input) {
        return terminal.autocomplete(vorpal.cliSession, input);
    }
})
.action(vorpal.wrap(function*(session, args) {
    let cwd = yield session.env("cwd");
    let abspath = args.path ? terminal.normalize(cwd, args.path) : cwd;

    let node = yield api.vfs.resolve(abspath, false, args.options.l);

    let paths = yield api.vfs.lookup(node._id);

    for (let path of paths) {
        this.log(path);
    }
}));