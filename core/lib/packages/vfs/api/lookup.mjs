import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { createLog } from "../../../lib/log.mjs";

const log = createLog(import.meta.url);

export default async (client, id, options) => {
    const nodes = await Node.lookup(client, id);

    if (options.fix) {
        assert(client.isAdmin(), "Only admin can fix ref counts");

        if (nodes.length > 0 && nodes[0].properties.count !== nodes.length) {
            log.info(`Count for node ${nodes[0]._id} did not match the returned number of paths ${nodes.length}, will fix...`);

            await nodes[0]._props(client, { count: nodes.length });

            for (const node of nodes) { node.properties.count = nodes.length; }
        }
    }

    return await Promise.all(nodes.map((node) => node.serialize(client)));
};
