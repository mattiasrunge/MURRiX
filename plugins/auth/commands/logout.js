"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("logout", "Logout user")
.action(vorpal.wrap(async (ctx, session/*, args*/) => {
    let result = await api.auth.logout();

    if (!result) {
        throw new Error("Logout failed");
    }

    await session.env("username", "guest");
}));
