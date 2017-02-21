"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("login <username>", "Login as user")
.action(vorpal.wrap(async (ctx, session, args) => {
    let prompt = await ctx.promptAsync({
        type: "password",
        name: "password",
        message: "Password: "
    });

    let result = await api.auth.login(args.username, prompt.password);

    if (!result) {
        throw new Error("Login failed");
    }

    await session.env("username", args.username);

    let counts = await api.message.count();

    ctx.log("Welcome " + args.username.bold + ", you have " + counts.unread.toString().bold + " new message(s)!");
}));
