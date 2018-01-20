"use strict";

const assert = require("assert");
const Node = require("../lib/Node");
const { ADMIN_SESSION } = require("../lib/auth");

module.exports = async (session, password) => {
    if (!password) {
        session.admin = false;
    } else {
        const user = await Node.resolve(ADMIN_SESSION, "/users/admin");

        assert(await user.matchPassword(password), "Authentication failed");

        session.admin = new Date();
    }

    return session.admin;
};
