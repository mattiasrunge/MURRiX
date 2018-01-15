"use strict";

const Node = require("../lib/Node");

module.exports = async (session, abspath, mode, options = {}) => {
    const nodepath = await Node.resolve(session, abspath, { readlink: true });

    await nodepath.chmod(session, mode, options);
};
