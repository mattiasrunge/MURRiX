"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("message read [index]", "Read the last unread message or a specific message by index.")
.action(vorpal.wrap(async (ctx, session, args) => {
    let message = await api.message.read(typeof args.index !== "undefined" ? parseInt(args.index) : undefined);
    let username = await api.auth.uname(message.node.attributes.from);

    ctx.log("Received at " + message.node.properties.ctime.bold + " from " + username.bold + ":");
    ctx.log(message.node.attributes.text);
}));
