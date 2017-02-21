"use strict";

const vorpal = require("../../../cli/lib/vorpal");

vorpal
.command("whoami", "Shows current user")
.action(vorpal.wrap(async (ctx, session/*, args*/) => {
    ctx.log(await session.env("username"));
}));
