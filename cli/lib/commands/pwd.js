"use strict";

const vorpal = require("../vorpal");
const session = require("../session");

vorpal
.command("pwd", "Shows current working directory")
.action(vorpal.wrap(function*(/*args*/) {
    this.log(yield session.env("cwd"));
}));
