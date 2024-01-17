import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "c", "Get only get owners of cameras");

    return await api.list(client, `${abspath}/owners`);
};
