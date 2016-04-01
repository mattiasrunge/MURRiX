"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("message read [index]", "Read the last unread message or a specific message by index.")
.action(vorpal.wrap(function*(session, args) {
    let message = yield api.message.read(typeof args.index !== "undefined" ? parseInt(args.index) : undefined);
    let username = yield api.auth.uname(message.node.attributes.from);

    this.log("Received at " + message.node.properties.ctime.bold + " from " + username.bold + ":");
    this.log(message.node.attributes.text);
}));
