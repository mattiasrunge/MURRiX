"use strict";

const vorpal = require("../../vorpal");
const api = require("api.io").client;

vorpal
.command("message send <username> <text>", "Send a message to a user.")
.option("-s, --subject <text>", "Subject for the message.")
.action(vorpal.wrap(function*(args) {
    yield api.vfs.messageSend(args.username, args.text, args.options.subject);
}));
