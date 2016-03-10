"use strict";

const vorpal = require("../vorpal");
const session = require("../session");

vorpal
.command("setenv <name> <value>", "Set an environment variable")
.action(vorpal.wrap(function*(args) {
    yield session.env(args.name, args.value);
}));
