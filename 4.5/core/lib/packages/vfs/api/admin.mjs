import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { getAdminClient } from "../../../auth/index.mjs";

export default async (client, password) => {
    if (!password) {
        client.revokeAdmin();
    } else {
        const user = await Node.resolve(await getAdminClient(), "/users/admin");

        assert(await user.matchPassword(password), "Authentication failed");

        client.giveAdmin();
    }

    return client.isAdmin();
};
