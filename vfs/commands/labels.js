"use strict";

const Node = require("../lib/Node");

module.exports = async (session) => {
    return Node.labels(session);
};
