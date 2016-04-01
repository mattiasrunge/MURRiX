"use strict";

const vorpal = require("../../../cli/lib/vorpal");

vorpal
.command("pwd", "Shows current working directory")
.action(vorpal.wrap(function*(session/*, args*/) {
    this.log(yield session.env("cwd"));
}));
