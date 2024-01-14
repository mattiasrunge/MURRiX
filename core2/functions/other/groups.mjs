import assert from "node:assert";
import { getAdminClient } from "../../../auth/index.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, username = false) => {
    assert(!client.isGuest(), "Permission denied");

    const dir = username ? `/users/${username}/groups` : "/groups";

    return api.list(await getAdminClient(), dir);
};
