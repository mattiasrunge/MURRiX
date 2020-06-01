"use strict";

const path = require("path");
const Node = require("../../../core/Node");

module.exports = async (client, abspath, type, attributes = {}) => {
    try {
        return await Node.resolve(client, abspath);
    } catch {
        const parentPath = path.dirname(abspath);
        const name = path.basename(abspath);

        const parent = await Node.resolve(client, parentPath);

        return await parent.createChild(client, type, name, attributes);
    }
};
