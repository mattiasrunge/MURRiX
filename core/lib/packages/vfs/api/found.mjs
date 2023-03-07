import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, id) => {
    const node = await Node.resolve(client, id);

    assert(!node.path, `Node ${node._id} is not lost!`);

    await api.link(client, node, `/lost+found/${node._id}`);

    return api.resolve(client, node._id);
};
