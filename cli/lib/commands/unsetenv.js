"use strict";

const vorpal = require("../vorpal");
const session = require("../session");

vorpal
.command("unsetenv <name>", "Unset an environment variable")
.action(vorpal.wrap(function*(args) {
    yield session.env(args.name, null);
}));
