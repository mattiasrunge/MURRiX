import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "p", "Get only get children of persons");

    const children = await api.list(client, `${abspath}/children`);

    await Promise.all(children.map(async (child) => {
        child.age = await api.age(client, child.path);
    }));

    children.sort((a, b) => b.age.age - a.age.age);

    return children;
};
