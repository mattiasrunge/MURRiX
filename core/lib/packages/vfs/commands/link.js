"use strict";

const path = require("path");
const Node = require("../../../core/Node");

module.exports = async (client, srcpath, dstpath) => {
    const srcnode = await Node.resolve(client, srcpath);

    // Two alternatives:
    // - dstnode does exist, dstpath is our target parentpath
    // - dstnode does not exist, dstpath is our target abspath

    let dstparentnode;

    try {
        dstparentnode = await Node.resolve(client, dstpath);
    } catch (error) {}

    if (!dstparentnode) {
        srcnode.name = path.basename(dstpath);
        dstparentnode = await Node.resolve(client, path.dirname(dstpath));
    }

    await dstparentnode.appendChild(client, srcnode);
};
