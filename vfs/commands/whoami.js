"use strict";

const path = require("path");
const resolve = require("./resolve");
const logout = require("./logout");
const { ADMIN_SESSION } = require("../lib/auth");

module.exports = async (session) => {
    if (!session.username) {
        return logout(session);
    }

    const dir = path.join("/users", session.username);
    const user = await resolve(ADMIN_SESSION, dir);

    user.adminGranted = session.admin;

    return user;
};
