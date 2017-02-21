"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("regenerate <match>", "Regenerate file nodes")
.action(vorpal.wrap(async (ctx, session, args) => {
    let count = 0;

    if (args.match === "other") {
        count = await api.file.regenerateOther();
    } else {
        throw new Error("Unknown match type");
    }

    ctx.log("Regenerated " + count + " nodes");
}));
