"use strict";

const vorpal = require("../../vorpal");
const vfs = require("../../vfs");

vorpal
.command("message count", "Display how many messages you have.")
.action(vorpal.wrap(function*(args) {
    let counts = yield vfs.messageCount();

    this.log("You have " + counts.unread.toString().bold + " unread messages out of a total of " + counts.total.toString().bold);
}));
