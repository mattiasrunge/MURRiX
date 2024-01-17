import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { getAdminClient } from "../../../auth/index.mjs";
import { api } from "../../../api/index.mjs";

export default async (client) => {
    assert(!client.isGuest(), "Permission denied");

    const abspath = `/users/${client.getUsername()}/stars`;
    await api.ensure(await getAdminClient(), abspath, "d");

    const list = await Node.list(await getAdminClient(), abspath);

    return Promise.all(list.map((nodepath) => nodepath.serialize(client)));
};
