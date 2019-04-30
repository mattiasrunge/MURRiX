"use strict";

const path = require("path");
const Node = require("../../../core/Node");
const { ADMIN_SESSION } = require("../../../core/auth");

module.exports = async (session, srcpath, dstpath) => {
    const srcnode = await Node.resolve(session, srcpath);
    const srcparentnode = await Node.resolve(session, path.dirname(srcpath));

    // Two alternatives:
    // - dstnode does exist, dstpath is our target parentpath
    // - dstnode does not exist, dstpath is our target abspath

    let dstparentnode;
    let name = srcnode.name;

    try {
        dstparentnode = await Node.resolve(session, dstpath);
    } catch (error) {}

    if (!dstparentnode) {
        name = path.basename(dstpath);
        dstparentnode = await Node.resolve(session, path.dirname(dstpath));
    }

    await srcparentnode.removeChild(session, srcnode);

    // Since srcparentnode and dstparentnode might be the same, our copy
    // of dstparentnode is stale after the removeChild call above, use
    // the valid copy srcparentnode instead.
    if (srcparentnode._id === dstparentnode._id) {
        dstparentnode = srcparentnode;
    }

    srcnode.name = name;
    await dstparentnode.appendChild(session, srcnode);

    // Find all symlinks that point to the old path and redirect them
    const links = await Node.query(ADMIN_SESSION, {
        "properties.type": "s",
        "attributes.path": srcpath
    });

    for (const link of links) {
        await link.update(ADMIN_SESSION, {
            path: dstpath
        });
    }
};
