"use strict";

const vorpal = require("../vorpal");
const vfs = require("../vfs");
const session = require("../session");

vorpal
.command("logout", "Logout user")
.action(vorpal.wrap(function*(/*args*/) {
    let result = yield vfs.logout();

    if (!result) {
        throw new Error("Logout failed");
    }

    yield session.env("username", "guest");
}));
