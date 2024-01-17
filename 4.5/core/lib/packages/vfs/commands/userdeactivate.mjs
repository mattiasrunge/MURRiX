
import assert from "node:assert";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Deactivate a user account
    opts,
    username // Username
) => {
    assert(client.isAdmin(), "Permission denied");

    await api.useractivation(client, username, false);
};
