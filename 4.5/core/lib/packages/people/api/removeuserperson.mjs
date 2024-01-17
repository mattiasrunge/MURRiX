import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "u", "Get only remove a person on a user");

    if (await api.exists(client, `${abspath}/person`)) {
        await api.unlink(client, `${abspath}/person`);
    }
};
