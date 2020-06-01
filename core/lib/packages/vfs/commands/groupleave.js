"use strict";

const assert = require("assert");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Remove a user from a group
    opts,
    groupname, // Groupname
    username // Username
) => {
    assert(client.isAdmin(), "Only administrators can remove users from groups");

    await api.groupleave(client, groupname, username);
};
