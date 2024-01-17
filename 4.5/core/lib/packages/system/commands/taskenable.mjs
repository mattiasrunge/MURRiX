import assert from "node:assert";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Enable a task
    opts,
    task // Task
) => {
    assert(client.isAdmin(), "Only administrators can enable tasks");

    await api.update(client, task.path, { enabled: true });
};
