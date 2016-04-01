"use strict";

const vorpal = require("../../../cli/lib/vorpal");

vorpal
.command("whoami", "Shows current user")
.action(vorpal.wrap(function*(session/*, args*/) {
    this.log(yield session.env("username"));
}));
