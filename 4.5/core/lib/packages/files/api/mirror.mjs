import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Only files can be mirrored");
    assert(await api.access(client, node, "w"), "Permission denied");

    await node.update(client, { mirror: !node.attributes.mirror });

    await api.rmmedia(client, node, "image");
    await api.rmmedia(client, node, "video");
};
