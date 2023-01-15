"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { getAdminClient } = require("../../../auth");

module.exports = async (client, username, active) => {
    assert(client.isAdmin(), "Permission denied");

    const user = await Node.resolve(await getAdminClient(), `/users/${username}`);

    return user.setActivation(await getAdminClient(), active);
};
