"use strict";

const Node = require("../lib/Node");

module.exports = async (session, abspath, options = {}) => {
    return Node.exists(session, abspath, options);
};
