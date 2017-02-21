"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("mkgroup <name>", "Create a new group")
.action(vorpal.wrap(async (ctx, session, args) => {
    let prompt = await ctx.promptAsync({
        type: "input",
        name: "name",
        message: "Name: "
    });

    await api.auth.mkgroup(args.name, prompt.name);
}));
