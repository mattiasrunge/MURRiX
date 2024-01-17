import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import media from "../../../media/index.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath) => {
    let node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Can only get media for files");
    assert(node.path, `Node with id ${node._id} seems to not be present in the tree, it has no path, can not cache media`);

    try {
        for (const size of media.requiredSizes) {
            const result = await api.url(client, node.path, {
                width: size.width,
                height: size.height,
                type: size.type
            });

            assert(result !== null, "Failed to get url for media");
        }
    } catch (error) {
        node = await Node.resolve(client, node.path); // Resolve again to make sure we do not have a stale copy and overwrite something
        await node.update(client, { cacheError: error.stack.toString() }, true);
    }

    await api.syncmedia(client, abspath);
};
