"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const client = require("../client");
const vfs = require("../vfs");

vorpal
.command("find <search>", "Find nodes")
.action(vorpal.wrap(function*(args) {
    let items = yield client.call("find", {
        abspath: yield session.env("cwd"),
        search: args.search
    });

    this.log(items.join("\n"));
}));
