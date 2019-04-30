"use strict";

const path = require("path");

module.exports = async (session, cwd, dir) => {
    const trailingSlash = dir[dir.length - 1] === "/";
    dir = path.resolve(cwd, dir);

    dir += trailingSlash ? "/" : "";

    return dir.replace(/\/+/g, "/");
};
