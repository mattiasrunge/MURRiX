"use strict";

const path = require("path");

module.exports = async (client, value) => path.basename(value);
