import assert from "node:assert";
import { api } from "../../../api/index.mjs";
import { getAdminClient } from "../../../auth/index.mjs";

export default async (client, term,
    // Change directory
    opts,
    abspath = "" // AbsolutePath
) => {
    if (abspath === client.getCurrentDirectory()) {
        return;
    }

    assert(await api.exists(await getAdminClient(), abspath), `${abspath}: Path not found`);
    assert(await api.access(client, abspath, "x"), `${abspath}: Permission denied`);

    client.setCurrentDirectory(abspath);
};
