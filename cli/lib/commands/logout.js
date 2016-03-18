"use strict";

const vorpal = require("../vorpal");
const api = require("api.io").client;
const session = require("../session");

vorpal
.command("logout", "Logout user")
.action(vorpal.wrap(function*(/*args*/) {
    let result = yield api.vfs.logout();

    if (!result) {
        throw new Error("Logout failed");
    }

    yield session.env("username", "guest");
}));
