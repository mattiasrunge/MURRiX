"use strict";

const { api } = require("../../api");
const config = require("../../config");

const setup = async (client) => {
    // Ensure tasks
    if (config.stagingDirectory) {
        await api.ensure(client, "/system/tasks/stagefiles", "j", {
            ownerPackage: "staging",
            command: "task_stagefiles"
        });
    } else {
        await api.unlink(client, "/system/tasks/stagefiles");
    }
};

setup.dependencies = [
    "files",
    "system",
    "vfs"
];

module.exports = setup;
