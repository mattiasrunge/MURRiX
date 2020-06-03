"use strict";

const assert = require("assert");
const path = require("path");
const Node = require("../../../lib/Node");
const { ADMIN_CLIENT } = require("../../../auth");

module.exports = async (client, srcpath, dstpath, options = {}) => {
    const srcnode = await Node.resolve(client, srcpath);
    const srcparentnode = await Node.resolve(client, path.dirname(srcpath));

    // Two alternatives:
    // - dstnode does exist, dstpath is our target parentpath
    // - dstnode does not exist, dstpath is our target abspath

    let dstparentnode;
    let name = srcnode.name;

    try {
        dstparentnode = await Node.resolve(client, dstpath);
    } catch {}

    if (!dstparentnode) {
        name = path.basename(dstpath);
        dstparentnode = await Node.resolve(client, path.dirname(dstpath));
    }

    assert(srcnode._id !== dstparentnode._id, `${srcnode.path} can not be moved into itself`);

    await srcparentnode.removeChild(client, srcnode);

    // Since srcparentnode and dstparentnode might be the same, our copy
    // of dstparentnode is stale after the removeChild call above, use
    // the valid copy srcparentnode instead.
    if (srcparentnode._id === dstparentnode._id) {
        dstparentnode = srcparentnode;
    }

    srcnode.name = name;
    await dstparentnode.appendChild(client, srcnode);

    if (options.inherit) {
        await srcnode.cloneAccess(client, dstparentnode, { recursive: true });
    }

    // Find all symlinks that point to the old path and redirect them
    const links = await Node.query(ADMIN_CLIENT, {
        "properties.type": "s",
        "attributes.path": srcpath
    });

    for (const link of links) {
        await link.update(ADMIN_CLIENT, {
            path: dstpath
        });
    }
};
