"use strict";

const vorpal = require("../../vorpal");
const vfs = require("../../vfs");

vorpal
.command("message read [index]", "Read the last unread message or a specific message by index.")
.action(vorpal.wrap(function*(args) {
    let message = yield vfs.messageRead(typeof args.index !== "undefined" ? parseInt(args.index) : undefined);
    let username = yield vfs.uname(message.node.attributes.from);

    this.log("Received at " + message.node.properties.ctime.bold + " from " + username.bold + ":");
    this.log(message.node.attributes.text);
}));
