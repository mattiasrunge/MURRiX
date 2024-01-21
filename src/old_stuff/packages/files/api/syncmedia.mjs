import path from "node:path";
import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import config from "../../../config/index.mjs";
import media from "../../../media/index.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath) => {
    let node = await Node.resolve(client, abspath);

    assert(await api.access(client, node, "w"), "Permission denied");
    assert(node.properties.type === "f", "Only files can have cached media");

    const filename = path.join(config.fileDirectory, node.attributes.diskfilename);
    const cached = await media.getAllCached(node._id, filename, "*", { format: true });

    node = await Node.resolve(client, node.path); // Resolve again to make sure we do not have a stale copy and overwrite something
    await node.update(client, { cached }, true);
};
