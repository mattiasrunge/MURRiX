"use strict";

const vorpal = require("../vorpal");

vorpal
.command("unsetenv <name>", "Unset an environment variable")
.action(vorpal.wrap(function*(session, args) {
    yield session.env(args.name, null);
}));
