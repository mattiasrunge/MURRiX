"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("find <search>", "Find nodes")
.action(vorpal.wrap(async (ctx, session, args) => {
    let cwd = await session.env("cwd");

    let items = await api.vfs.find(cwd, args.search);

    ctx.log(items.join("\n"));
}));
