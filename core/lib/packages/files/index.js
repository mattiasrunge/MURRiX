"use strict";

const path = require("path");
const fs = require("fs-extra");
const { api } = require("../../api");
const bus = require("../../../lib/bus");
const config = require("../../config");

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

    bus.on("node.remove", async (event, { node }) => {
        if (node.properties.type === "f") {
            const filename = path.join(config.fileDirectory, node.attributes.diskfilename);
            await fs.remove(filename);
        }
    });
};

setup.dependencies = [
    "system",
    "vfs"
];

module.exports = setup;
