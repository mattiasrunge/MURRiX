"use strict";

const Node = require("../../../core/Node");

module.exports = async (client, abspath, options = {}) => Node.exists(client, abspath, options);
