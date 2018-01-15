"use strict";

const Node = require("../lib/Node");

// TODO: Add support for limit/skip and sorting

module.exports = async (session, abspath, options = {}) => {
    const list = await Node.list(session, abspath, options);

    return Promise.all(list.map((nodepath) => nodepath.serialize(session)));
};
