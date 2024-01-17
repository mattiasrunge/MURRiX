import assert from "node:assert";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Disable a task
    opts,
    task // Task
) => {
    assert(client.isAdmin(), "Only administrators can disable tasks");

    await api.update(client, task.path, { enabled: false });
};
