import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Find files duplicates in this node
    opts,
    abspath = "" // AbsolutePath
) => {
    const nodes = await api.duplicatelist(client, abspath);

    for (const node of nodes) {
        term.writeln(node.path);
    }
};
