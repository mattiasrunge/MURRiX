"use strict";

const path = require("path");
const Node = require("../lib/Node");

module.exports = async (session, abspath) => {
    const parentPath = path.dirname(abspath);

    const parent = await Node.resolve(session, parentPath);
    const child = await Node.resolve(session, abspath, { nofollow: true });

    await parent.removeChild(session, child);
    await child.remove(session);
};
