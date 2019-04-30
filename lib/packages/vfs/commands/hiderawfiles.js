"use strict";

const path = require("path");
const assert = require("assert");
const Node = require("../../../core/Node");
const ensure = require("./ensure");
const move = require("./move");

module.exports = async (session, abspath) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "a", "Can only hide files in albums");

    const filespath = `${abspath}/files`;
    const nodes = await Node.list(session, filespath, { nofollow: true });

    const rawfiles = nodes.filter((file) => file.attributes.rawImage);
    const files = nodes.filter((file) => !file.attributes.rawImage);

    let count = 0;

    for (const rawfile of rawfiles) {
        const basename = path.parse(rawfile.attributes.name).name;

        const file = files.find((file) => path.parse(file.attributes.name).name === basename);

        if (file) {
            const versionspath = `${file.path}/versions`;

            await ensure(session, versionspath, "d");
            await move(session, rawfile.path, versionspath);

            count++;
        }
    }

    return {
        files: files.length,
        rawfiles: rawfiles.length,
        hidden: count
    };
};
