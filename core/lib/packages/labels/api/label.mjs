import path from "node:path";
import assert from "node:assert";
import { getAdminClient } from "../../../auth/index.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, label, abspath) => {
    assert(await api.access(client, abspath, "w"), "Permission denied");

    const nodes = await api.list(await getAdminClient(), `/labels/${label}`, {
        noerror: true,
        nofollow: true,
        query: {
            "attributes.path": abspath
        }
    });

    if (nodes.length > 0) {
        for (const node of nodes) {
            await api.unlink(await getAdminClient(), node.path);
        }

        const labelNode = await api.resolve(await getAdminClient(), `/labels/${label}`);

        if (labelNode.properties.children.length === 0) {
            await api.unlink(await getAdminClient(), `/labels/${label}`);
        }

        return false;
    }

    await api.ensure(await getAdminClient(), `/labels/${label}`, "d");
    await api.chmod(await getAdminClient(), `/labels/${label}`, 0o775);
    await api.symlink(await getAdminClient(), abspath, `/labels/${label}/${path.basename(abspath)}`);

    return true;
};
