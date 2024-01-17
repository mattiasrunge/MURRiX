import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Find files duplicates
    opts,
    abspath = "" // AbsolutePath
) => {
    const paths = await api.duplicates(client, abspath);

    for (const path of paths) {
        term.writeln(path);
    }
};
