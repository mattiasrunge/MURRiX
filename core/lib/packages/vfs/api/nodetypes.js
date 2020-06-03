"use strict";

const Node = require("../../../lib/Node");

module.exports = async (client, filtered = false) => Node.getTypes(filtered);
