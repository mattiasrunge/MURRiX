"use strict";

const assert = require("assert");
const TaskManager = require("../../../tasks/manager");

module.exports = async (client, task) => {
    assert(client.isAdmin(), "Permission denied");

    await TaskManager.stopTask(task);
};
