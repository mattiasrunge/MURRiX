import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { getAdminClient } from "../../../auth/index.mjs";

export default async (client, history = false) => {
    // Do not save history for a guest
    if (client.isGuest()) {
        return [];
    }

    const user = await Node.resolve(await getAdminClient(), `/users/${client.getUsername()}`);

    assert(user, `No user found, with username ${client.getUsername()}, strange...`);

    if (history) {
        return await user.update(await getAdminClient(), { history }, true);
    }

    return user.attributes.history ?? [];
};
