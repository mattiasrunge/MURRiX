import assert from "node:assert";
import path from "node:path";
import Node from "../../../lib/Node.mjs";
import config from "../../../config/index.mjs";
import media from "../../../media/index.mjs";

export default async (client, abspath, options = {}) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Metadata must be run on a file");

    const filename = path.join(config.fileDirectory, node.attributes.diskfilename);

    return await media.getMetadata(filename, options);
};
