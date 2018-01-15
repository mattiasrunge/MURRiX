"use strict";

const Node = require("../lib/Node");

module.exports = async (session, abspath, attributes) => {
    const node = await Node.resolve(session, abspath, { readlink: true });

    await node.update(session, attributes);
};
