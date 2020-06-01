"use strict";

const path = require("path");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Copy node or nodes
    opts,
    srcpath, // AbsolutePath
    dstpath // AbsolutePath
) => {
    const nodes = await api.resolve(client, srcpath, {
        list: true,
        noerror: true
    });

    for (const node of nodes) {
        await api.copy(client, node.path, path.join(dstpath, "/"));
    }
};
