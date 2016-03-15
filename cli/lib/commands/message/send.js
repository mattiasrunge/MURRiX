"use strict";

const vorpal = require("../../vorpal");
const vfs = require("../../vfs");

vorpal
.command("message send <username> <text>", "Send a message to a user.")
.option("-s, --subject <text>", "Subject for the message.")
.action(vorpal.wrap(function*(args) {
    yield vfs.messageSend(args.username, args.text, args.options.subject);
}));
