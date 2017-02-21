"use strict";

const vorpal = require("../vorpal");

vorpal
.command("env", "List all environment variables")
.action(vorpal.wrap(async (ctx, session/*, args*/) => {
    for (let name of Object.keys(session.environment)) {
        let value = await session.env(name);
        if (typeof value === "string") {
            ctx.log(name + "=" + value);
        }
    }
}));
