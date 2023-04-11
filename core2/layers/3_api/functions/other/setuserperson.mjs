import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath, personpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "u", "Get only set a person on a user");

    await api.removeuserperson(client, abspath);
    await api.symlink(client, personpath, `${abspath}/person`);
};
