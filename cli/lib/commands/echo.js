"use strict";

const vorpal = require("../vorpal");
const session = require("../session");

vorpal
.command("echo <text>", "Echo text")
.action(vorpal.wrap(function*(args) {
    this.log(session.expand(args.text));
}));
