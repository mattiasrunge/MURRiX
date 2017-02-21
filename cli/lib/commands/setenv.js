"use strict";

const vorpal = require("../vorpal");

vorpal
.command("setenv <name> <value>", "Set an environment variable")
.action(vorpal.wrap(async (ctx, session, args) => {
    await session.env(args.name, args.value);
}));
