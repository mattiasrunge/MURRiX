import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { getAdminClient } from "../../../auth/index.mjs";

export default async (client, username, active) => {
    assert(client.isAdmin(), "Permission denied");

    const user = await Node.resolve(await getAdminClient(), `/users/${username}`);

    return user.setActivation(await getAdminClient(), active);
};
