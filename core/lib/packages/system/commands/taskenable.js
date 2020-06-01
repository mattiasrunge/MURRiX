"use strict";

const assert = require("assert");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Enable a task
    opts,
    task // Task
) => {
    assert(client.isAdmin(), "Only administrators can enable tasks");

    await api.update(client, task.path, { enabled: true });
};
