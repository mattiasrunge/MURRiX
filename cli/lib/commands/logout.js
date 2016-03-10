"use strict";

const vorpal = require("../vorpal");
const client = require("../client");
const session = require("../session");

vorpal
.command("logout", "Logout user")
.action(vorpal.wrap(function*(/*args*/) {
    let result = yield client.call("logout");

    if (!result) {
        throw new Error("Logout failed");
    }

    yield session.env("username", "guest");
}));
