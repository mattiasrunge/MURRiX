"use strict";

const { GID_USERS } = require("../../auth");
const { api } = require("../../api");

const setup = async (client) => {
    // Create folders
    await api.ensure(client, "/people", "d", { gid: GID_USERS });
};

setup.dependencies = [
    "vfs",
    "texts"
];

module.exports = setup;
