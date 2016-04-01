"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("message send <username> <text>", "Send a message to a user.")
.option("-s, --subject <text>", "Subject for the message.")
.action(vorpal.wrap(function*(session, args) {
    yield api.message.send(args.username, args.text, args.options.subject);
}));
