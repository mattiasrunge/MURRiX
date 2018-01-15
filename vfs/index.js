"use strict";

const VFS = require("./lib/VFS");
const Node = require("./lib/Node");
const auth = require("./lib/auth");
const mode = require("./lib/mode");
const bus = require("./lib/bus");

const vfs = new VFS();

vfs.register(__dirname);

module.exports = {
    Node,
    auth,
    mode,
    bus,
    vfs
};
