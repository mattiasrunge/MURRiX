"use strict";

const Node = require("../lib/Node");
const regenerate = require("./regenerate");

module.exports = async (session, abspath, attributes) => {
    const node = await Node.resolve(session, abspath, { readlink: true });

    await node.update(session, attributes);

    return regenerate(session, node.path);
};
