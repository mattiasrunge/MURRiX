"use strict";

const { api } = require("../../api");

const setup = async (client) => {
    // Create folder
    await api.ensure(client, "/labels", "d");
    await api.chmod(client, "/labels", 0o775);
};

setup.dependencies = [
    "vfs"
];

module.exports = setup;
