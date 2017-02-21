"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("message count", "Display how many messages you have.")
.action(vorpal.wrap(async (ctx/* , session, args*/) => {
    let counts = await api.message.count();

    ctx.log("You have " + counts.unread.toString().bold + " unread messages out of a total of " + counts.total.toString().bold);
}));
