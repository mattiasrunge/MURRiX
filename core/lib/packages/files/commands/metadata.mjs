import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Print file metadata
    opts,
    abspath = "" // AbsolutePath
) => {
    const metadata = await api.metadata(client, abspath);

    term.writeJson(metadata);
};
