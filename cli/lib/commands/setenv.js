"use strict";

const vorpal = require("../vorpal");

vorpal
.command("setenv <name> <value>", "Set an environment variable")
.action(vorpal.wrap(function*(session, args) {
    yield session.env(args.name, args.value);
}));
