"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../core/auth");

module.exports = async (client, password) => {
    if (!password) {
        client.revokeAdmin();
    } else {
        const user = await Node.resolve(ADMIN_CLIENT, "/users/admin");

        assert(await user.matchPassword(password), "Authentication failed");

        client.giveAdmin();
    }

    return client.isAdmin();
};
