
import assert from "node:assert";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Create a user
    opts,
    username // Generic
) => {
    assert(client.isAdmin(), "Only administrators can create users");

    const name = await term.ask("Name:");

    await api.mkuser(client, username, name);
};
