import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { getAdminClient } from "../../../auth/index.mjs";

export default async (client, username, oldPassword, newPassword) => {
    assert(username === client.getUsername() || client.isAdmin(), "Permission denied");

    const user = await Node.resolve(await getAdminClient(), `/users/${username}`);

    if (!client.isAdmin()) {
        assert(await user.matchPassword(oldPassword), "Authentication failed");
    }

    return user.setPassword(await getAdminClient(), newPassword);
};
