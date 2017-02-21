"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("passwd [username]", "Change user password")
.action(vorpal.wrap(async (ctx, session, args) => {
    let username = args.username || (await session.env("username"));
    let prompt1 = await ctx.promptAsync({
        type: "password",
        name: "password",
        message: "New password: "
    });
    let prompt2 = await ctx.promptAsync({
        type: "password",
        name: "password",
        message: "Confirm new password: "
    });

    if (prompt1.password !== prompt2.password) {
        throw new Error("Passwords do not match");
    }

    await api.auth.passwd(username, prompt1.password);

    ctx.log("Password updated".green);
}));
