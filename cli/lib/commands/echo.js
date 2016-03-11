"use strict";

const vorpal = require("../vorpal");
const session = require("../session");
const expandvar = require("expand-var");

vorpal
.command("echo <text>", "Echo text")
.action(vorpal.wrap(function*(args) {
    this.log(expandvar(args.text, session.environment));
}));
