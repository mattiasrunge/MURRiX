import path from "node:path";
import fs from "fs-extra";
import { api } from "../../api/index.mjs";
import bus from "../../bus/index.mjs";
import config from "../../config/index.mjs";

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

export default setup;
