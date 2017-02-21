"use strict";

const vorpal = require("../vorpal");

vorpal
.command("echo <text>", "Echo text")
.action(vorpal.wrap(async (ctx, session, args) => {
    ctx.log(session.expand(args.text));
}));
