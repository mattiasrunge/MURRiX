import assert from "node:assert";
import path from "node:path";
import Node from "../../../lib/Node.mjs";
import config from "../../../config/index.mjs";
import media from "../../../media/index.mjs";

export default async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Can only get media for files");

    const filename = path.join(config.fileDirectory, node.attributes.diskfilename);

    const cached = await media.getCached(node._id, filename, {
        angle: node.attributes.angle,
        mirror: node.attributes.mirror,
        width: 2000,
        type: "image"
    });

    return await media.detectFaces(cached);
};
