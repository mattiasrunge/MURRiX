"use strict";

const path = require("path");
const Node = require("../lib/Node");

module.exports = async (session, srcpath, dstpath) => {
    const srcnode = await Node.resolve(session, srcpath);
    const srcparentnode = await Node.resolve(session, path.dirname(srcpath));

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

    srcparentnode.removeChild(session, srcnode);

    // Since srcparentnode and dstparentnode might be the same, don't
    // overwrite the remove with the now stale dstparentnode data
    if (srcparentnode._id === dstparentnode._id) {
        dstparentnode = srcparentnode;
    }

    await dstparentnode.appendChild(session, srcnode);
};
