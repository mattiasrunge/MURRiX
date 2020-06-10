"use strict";

const { GID_USERS } = require("../../auth");
const { api } = require("../../api");

const setup = async (client) => {
    // Create folders
    await api.ensure(client, "/cameras", "d", { gid: GID_USERS });
};

setup.dependencies = [
    "vfs",
    "people"
];

module.exports = setup;
