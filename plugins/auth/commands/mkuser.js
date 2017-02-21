"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("mkuser <username>", "Create a new user")
.action(vorpal.wrap(async (ctx, session, args) => {
    let prompt = await ctx.promptAsync({
        type: "input",
        name: "name",
        message: "Name: "
    });

    await api.auth.mkuser(args.username, prompt.name);
}));
