"use strict";

const path = require("path");
const Path = require("./Path");

class AbsolutePath extends Path {
    static async transform(client, value) {
        return path.resolve(client.getCurrentDirectory(), value);
    }
}

module.exports = AbsolutePath;
