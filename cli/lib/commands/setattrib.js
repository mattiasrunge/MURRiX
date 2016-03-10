"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const client = require("../client");
const vfs = require("../vfs");

vorpal
.command("setattrib <name> <value> [path]", "Set node attribute")
.autocomplete({
    data: function(input) {
        return vfs.autocomplete(input);
    }
})
.action(vorpal.wrap(function*(args) {
    let dir = args.path || (yield session.env("cwd"));
    let query = {
        abspath: vfs.normalize(yield session.env("cwd"), dir),
        attributes: {}
    };

    query.attributes[args.name] = args.value;

    yield client.call("setattributes", query);
}));
