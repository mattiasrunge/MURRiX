import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { getAdminClient } from "../../../auth/index.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath) => {
    assert(!client.isGuest(), "Permission denied");

    const starspath = `/users/${client.getUsername()}/stars`;
    await api.ensure(await getAdminClient(), starspath, "d");

    const list = await Node.list(await getAdminClient(), starspath, { nofollow: true });
    const star = list.find((node) => node.attributes.path === abspath);

    if (star) {
        await api.unlink(await getAdminClient(), star.path);
    } else {
        await api.symlink(await getAdminClient(), abspath, starspath);
    }
};
