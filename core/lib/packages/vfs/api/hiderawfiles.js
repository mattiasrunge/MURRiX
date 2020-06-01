"use strict";

const path = require("path");
const Node = require("../../../core/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath) => {
    const filespath = `${abspath}/files`;
    const nodes = await Node.list(client, filespath, { nofollow: true });

    const rawfiles = nodes.filter((file) => file.attributes.rawImage);
    const files = nodes.filter((file) => !file.attributes.rawImage);

    let count = 0;

    for (const rawfile of rawfiles) {
        const basename = path.parse(rawfile.attributes.name).name;

        const file = files.find((file) => path.parse(file.attributes.name).name === basename);

        if (file) {
            const versionspath = `${file.path}/versions`;

            await api.ensure(client, versionspath, "d");
            await api.move(client, rawfile.path, versionspath);

            count++;
        }
    }

    return {
        files: files.length,
        rawfiles: rawfiles.length,
        hidden: count
    };
};
