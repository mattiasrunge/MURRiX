"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const client = require("../client");
const vfs = require("../vfs");

vorpal
.command("attribs [path]", "Print node attributes")
.autocomplete({
    data: function(input) {
        return vfs.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    let dir = args.path || (yield session.env("cwd"));
    let node = yield client.call("resolve", {
        abspath: vfs.normalize(yield session.env("cwd"), dir)
    });

    this.log(JSON.stringify(node.attributes, null, 2));
}));
