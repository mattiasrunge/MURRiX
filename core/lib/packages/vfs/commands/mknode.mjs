import { dirname, basename } from "node:path";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Create a node
    opts,
    path, // AbsolutePath
    type = "d" // NodeType
) => {
    const parentpath = await dirname(path);
    const name = await basename(path);

    await api.create(client, parentpath, type, name);
};
