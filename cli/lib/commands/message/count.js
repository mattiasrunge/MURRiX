"use strict";

const vorpal = require("../../vorpal");
const api = require("api.io").client;

vorpal
.command("message count", "Display how many messages you have.")
.action(vorpal.wrap(function*(args) {
    let counts = yield api.vfs.messageCount();

    this.log("You have " + counts.unread.toString().bold + " unread messages out of a total of " + counts.total.toString().bold);
}));
