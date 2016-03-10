"use strict";

const vorpal = require("../vorpal");
const session = require("../session");

vorpal
.command("env", "List all environment variables")
.action(vorpal.wrap(function*(/*args*/) {
    for (let name of Object.keys(session.environment)) {
        let value = yield session.env(name);
        if (typeof value === "string") {
            this.log(name + "=" + value);
        }
    }
}));
