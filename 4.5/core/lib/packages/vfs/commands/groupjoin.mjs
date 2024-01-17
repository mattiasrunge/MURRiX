import assert from "node:assert";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Add a user to a group
    opts,
    groupname, // Groupname
    username // Username
) => {
    assert(client.isAdmin(), "Only administrators can add users to groups");

    await api.groupjoin(client, groupname, username);
};
