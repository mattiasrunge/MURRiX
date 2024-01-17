import { join } from "node:path";
import { api } from "../../../api/index.mjs";

export default async (client, label, types, excludePaths = []) => {
    const nodes = await api.list(client, join("/labels", label, "*"), {
        noerror: true
    });
    const list = nodes
    .filter((node) => !excludePaths.includes(node.path))
    .filter((node) => types.includes(node.properties.type));

    if (list.length > 0) {
        const index = Math.floor(Math.random() * list.length);

        return list.splice(index, 1)[0];
    }

    throw new Error("Could not find a readable random node based on label");
};
