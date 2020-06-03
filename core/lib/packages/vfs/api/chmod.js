"use strict";

const Node = require("../../../lib/Node");

module.exports = async (client, abspath, mode, options = {}) => {
    const nodepath = await Node.resolve(client, abspath, { readlink: true });

    await nodepath.chmod(client, mode, options);
};
