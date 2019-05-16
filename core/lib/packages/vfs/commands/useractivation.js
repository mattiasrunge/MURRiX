"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../core/auth");

module.exports = async (client, username, active) => {
    assert(client.isAdmin(), "Permission denied");

    const user = await Node.resolve(ADMIN_CLIENT, `/users/${username}`);

    return user.setActivation(ADMIN_CLIENT, active);
};
