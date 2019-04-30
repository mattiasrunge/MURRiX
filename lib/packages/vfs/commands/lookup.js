"use strict";

const Node = require("../../../core/Node");

module.exports = async (session, id) => {
    return await Node.lookup(session, id);
};
