"use strict";

const { GID_ADMIN } = require("../../auth");
const { api } = require("../../api");

const setup = async (client) => {
    // Create folders
    await api.ensure(client, "/system", "d", { gid: GID_ADMIN });
    await api.ensure(client, "/system/tasks", "d", { gid: GID_ADMIN });
};

setup.dependencies = [
    "vfs"
];

module.exports = setup;
