import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Get a random node that has label
    opts,
    label // Generic
) => {
    const node = await api.randombylabel(client, label, [ "a", "p", "l", "c" ]);

    term.writeln(node.path);
};
