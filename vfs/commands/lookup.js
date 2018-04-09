"use strict";

const Node = require("../lib/Node");

module.exports = async (session, id) => {
    return await Node.lookup(session, id);
};
