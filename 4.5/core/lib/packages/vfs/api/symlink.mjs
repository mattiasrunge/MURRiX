import path from "node:path";
import Node from "../../../lib/Node.mjs";

export default async (client, srcpath, dstpath) => {
    const srcnode = await Node.resolve(client, srcpath);

    // Two alternatives:
    // - dstnode does exist, dstpath is our target parentpath
    // - dstnode does not exist, dstpath is our target abspath

    let dstparentnode;

    try {
        dstparentnode = await Node.resolve(client, dstpath);
    } catch {}

    if (!dstparentnode) {
        srcnode.name = path.basename(dstpath);

        dstparentnode = await Node.resolve(client, path.dirname(dstpath));
    }

    return await dstparentnode.createChild(client, "s", srcnode.name, {
        path: srcnode.path
    });
};
