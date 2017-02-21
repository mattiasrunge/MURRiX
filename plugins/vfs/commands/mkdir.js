"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;
const terminal = require("../lib/terminal");

vorpal
.command("mkdir <path>", "Create a new directory node")
.action(vorpal.wrap(async (ctx, session, args) => {
    let cwd = await session.env("cwd");

    await api.vfs.create(terminal.normalize(cwd, args.path), "d");
}));
