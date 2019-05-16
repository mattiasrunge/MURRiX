"use strict";

const Node = require("../../../core/Node");

module.exports = async (client, abspath, mode, options = {}) => {
    const nodepath = await Node.resolve(client, abspath, { readlink: true });

    await nodepath.chmod(client, mode, options);
};
