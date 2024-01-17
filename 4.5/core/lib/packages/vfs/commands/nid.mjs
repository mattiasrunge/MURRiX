import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Print node id
    opts, // l Don't follow links
    abspath = "" // AbsolutePath
) => {
    const node = await api.resolve(client, abspath, {
        nofollow: opts.l
    });

    term.writeln(node._id);
};
