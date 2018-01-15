"use strict";

const Node = require("../lib/Node");

module.exports = async (session, abspath, uid, gid, options = {}) => {
    const nodepath = await Node.resolve(session, abspath, { readlink: true });

    await nodepath.chown(session, uid, gid, options);
};
