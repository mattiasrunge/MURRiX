"use strict";

const vorpal = require("../vorpal");
const session = require("../session");

vorpal
.command("whoami", "Shows current user")
.action(vorpal.wrap(function*(/*args*/) {
    this.log(yield session.env("username"));
}));
