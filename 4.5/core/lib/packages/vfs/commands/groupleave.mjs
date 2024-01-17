import assert from "node:assert";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Remove a user from a group
    opts,
    groupname, // Groupname
    username // Username
) => {
    assert(client.isAdmin(), "Only administrators can remove users from groups");

    await api.groupleave(client, groupname, username);
};
