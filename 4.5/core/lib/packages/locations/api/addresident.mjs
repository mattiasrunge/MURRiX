import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath, residentpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "l", "Get only add residents of locations");

    await api.symlink(client, residentpath, `${abspath}/residents`);
};
