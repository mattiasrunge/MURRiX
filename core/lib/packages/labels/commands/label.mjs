import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Toggle label on node
    opts,
    label, // Generic
    abspath = "" // AbsolutePath
) => {
    await api.label(client, label, abspath);
};
