"use strict";

const path = require("path");
const Node = require("../../../core/Node");

module.exports = async (client, abspath) => {
    const parentPath = path.dirname(abspath);

    const parent = await Node.resolve(client, parentPath);
    const child = await Node.resolve(client, abspath, { nofollow: true });

    await parent.removeChild(client, child);
    await child.remove(client);
};
