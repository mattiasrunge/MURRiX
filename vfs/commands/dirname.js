"use strict";

const path = require("path");

module.exports = async (session, value) => {
    return path.dirname(value);
};
