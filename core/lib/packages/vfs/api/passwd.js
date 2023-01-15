"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { getAdminClient } = require("../../../auth");

module.exports = async (client, username, oldPassword, newPassword) => {
    assert(username === client.getUsername() || client.isAdmin(), "Permission denied");

    const user = await Node.resolve(await getAdminClient(), `/users/${username}`);

    if (!client.isAdmin()) {
        assert(await user.matchPassword(oldPassword), "Authentication failed");
    }

    return user.setPassword(await getAdminClient(), newPassword);
};
