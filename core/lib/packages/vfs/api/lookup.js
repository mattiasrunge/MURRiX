"use strict";

const Node = require("../../../lib/Node");

module.exports = async (client, id) => await Node.lookup(client, id);
