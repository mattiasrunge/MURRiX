"use strict";

const assert = require("assert");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Disable a task
    opts,
    task // Task
) => {
    assert(client.isAdmin(), "Only administrators can disable tasks");

    await api.update(client, task.path, { enabled: false });
};
