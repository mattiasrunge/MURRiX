import assert from "node:assert";
import { getAdminClient } from "../../../auth/index.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, groupname = false) => {
    assert(!client.isGuest(), "Permission denied");

    const dir = groupname ? `/groups/${groupname}/users` : "/users";

    return api.list(await getAdminClient(), dir);
};
