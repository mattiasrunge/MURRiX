"use strict";

const assert = require("assert");
const TaskManager = require("../../../tasks");

module.exports = async (client, task) => {
    assert(client.isAdmin(), "Permission denied");

    await TaskManager.startTask(task);
};
