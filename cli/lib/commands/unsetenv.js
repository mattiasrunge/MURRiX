"use strict";

const vorpal = require("../vorpal");

vorpal
.command("unsetenv <name>", "Unset an environment variable")
.action(vorpal.wrap(async (ctx, session, args) => {
    await session.env(args.name, null);
}));
