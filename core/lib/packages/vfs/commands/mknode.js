"use strict";

const npath = require("path");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Create a node
    opts,
    path, // AbsolutePath
    type = "d" // NodeType
) => {
    const parentpath = await npath.dirname(path);
    const name = await npath.basename(path);

    await api.create(client, parentpath, type, name);
};
