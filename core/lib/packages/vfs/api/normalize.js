"use strict";

const path = require("path");

module.exports = async (client, cwd, dir) => {
    const trailingSlash = dir[dir.length - 1] === "/";
    dir = path.resolve(cwd, dir);

    dir += trailingSlash ? "/" : "";

    return dir.replace(/\/+/g, "/");
};
