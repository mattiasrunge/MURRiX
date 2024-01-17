import assert from "node:assert";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Create a group
    opts,
    name // Generic
) => {
    assert(client.isAdmin(), "Only administrators can create groups");

    const title = await term.ask("Title:");
    const description = await term.ask("Description:");

    await api.mkgroup(client, name, title, description);
};
