"use strict";

const Node = require("../../../lib/Node");

module.exports = async (client, abspath, options = {}) => Node.exists(client, abspath, options);
