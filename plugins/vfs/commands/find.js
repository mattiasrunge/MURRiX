"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("find <search>", "Find nodes")
.action(vorpal.wrap(function*(session, args) {
    let cwd = yield session.env("cwd");

    let items = yield api.vfs.find(cwd, args.search);

    this.log(items.join("\n"));
}));
