"use strict";

const Node = require("../../../core/Node");

module.exports = async (session, abspath, options = {}) => {
    return Node.exists(session, abspath, options);
};
