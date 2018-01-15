"use strict";

const Node = require("../lib/Node");

module.exports = async (session, abspath, ac, options = {}) => {
    const node = await Node.resolve(session, abspath);

    await node.setfacl(session, ac, options);
};
