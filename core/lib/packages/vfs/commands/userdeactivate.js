
"use strict";

const assert = require("assert");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Deactivate a user account
    opts,
    username // Username
) => {
    assert(client.isAdmin(), "Permission denied");

    await api.useractivation(client, username, false);
};
