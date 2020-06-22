"use strict";

const { api } = require("../../api");
const config = require("../../config");

const setup = async (client) => {
    // Ensure tasks
    if (config.dropbox) {
        await api.ensure(client, "/system/tasks/dropboxstagefiles", "j", {
            ownerPackage: "dropbox",
            command: "task_dropboxstagefiles"
        });
    } else {
        await api.unlink(client, "/system/tasks/dropboxstagefiles");
    }
};

setup.dependencies = [
    "system",
    "vfs"
];

module.exports = setup;
