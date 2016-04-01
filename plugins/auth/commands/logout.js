"use strict";

const vorpal = require("../../../cli/lib/vorpal");
const api = require("api.io").client;

vorpal
.command("logout", "Logout user")
.action(vorpal.wrap(function*(session/*, args*/) {
    let result = yield api.auth.logout();

    if (!result) {
        throw new Error("Logout failed");
    }

    yield session.env("username", "guest");
}));
