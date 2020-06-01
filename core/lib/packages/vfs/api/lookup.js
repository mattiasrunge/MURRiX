"use strict";

const Node = require("../../../core/Node");

module.exports = async (client, id) => await Node.lookup(client, id);
