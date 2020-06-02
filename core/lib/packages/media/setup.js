"use strict";

const { api } = require("../../api");

const setup = async (client) => {
    // Ensure tasks
    await api.ensure(client, "/system/tasks/filecachemedia", "j", {
        ownerPackage: "media",
        command: "task_filecachemedia"
    });

    await api.ensure(client, "/system/tasks/filechecksums", "j", {
        ownerPackage: "media",
        command: "task_filechecksums"
    });

    await api.ensure(client, "/system/tasks/filefaces", "j", {
        ownerPackage: "media",
        command: "task_filefaces"
    });
};

setup.PRIORITY = 3;

module.exports = setup;
