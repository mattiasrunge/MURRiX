import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath, ownerpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "c", "Get only add owners of cameras");

    await api.symlink(client, ownerpath, `${abspath}/owners`);
};
