"use strict";

const vorpal = require("../vorpal");

vorpal
.command("echo <text>", "Echo text")
.action(vorpal.wrap(function*(session, args) {
    this.log(session.expand(args.text));
}));
