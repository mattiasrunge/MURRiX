import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "u", "Path is not a user");

    const person = await api.resolve(client, `${abspath}/person`, { noerror: true });

    return person || null;
};
