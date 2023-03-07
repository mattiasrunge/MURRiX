import assert from "node:assert";
import path from "node:path";
import fs from "fs-extra";
import Node from "../../../lib/Node.mjs";
import config from "../../../config/index.mjs";
import media from "../../../media/index.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath, type) => {
    const node = await Node.resolve(client, abspath);

    assert(await api.access(client, node, "w"), "Permission denied");
    assert(node.properties.type === "f", "Only files can have cached media");

    const filename = path.join(config.fileDirectory, node.attributes.diskfilename);
    const list = await media.getAllCached(node._id, filename, type);

    for (const filename of list) {
        try {
            await fs.remove(filename);
        } catch {}
    }

    if (node.attributes.cached) {
        await api.syncmedia(client, node);
    }
};
