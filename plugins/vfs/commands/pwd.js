"use strict";

const vorpal = require("../../../cli/lib/vorpal");

vorpal
.command("pwd", "Shows current working directory")
.action(vorpal.wrap(async (ctx, session/*, args*/) => {
    ctx.log(await session.env("cwd"));
}));
