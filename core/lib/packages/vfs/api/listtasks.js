"use strict";

const assert = require("assert");
const TaskManager = require("../../../tasks/manager");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    return await TaskManager.listTasks();
};
