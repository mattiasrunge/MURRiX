"use strict";

const path = require("path");
const Node = require("../lib/Node");

module.exports = async (session, srcpath, dstpath) => {
    const srcnode = await Node.resolve(session, srcpath);

    // Two alternatives:
    // - dstnode does exist, dstpath is our target parentpath
    // - dstnode does not exist, dstpath is our target abspath

    let dstparentnode;

    try {
        dstparentnode = await Node.resolve(session, dstpath);
    } catch (error) {}

    if (!dstparentnode) {
        srcnode.name = path.basename(dstpath);
        dstparentnode = await Node.resolve(session, path.dirname(dstpath));
    }

    await dstparentnode.createChild(session, "s", srcnode.name, {
        path: srcnode.path
    });
};
