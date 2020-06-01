
"use strict";

const assert = require("assert");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Create a user
    opts,
    username // Generic
) => {
    assert(client.isAdmin(), "Only administrators can create users");

    const name = await term.ask("Name:");

    await api.mkuser(client, username, name);
};
