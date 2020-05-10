"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const media = require("../../../media");
const url = require("./url");
const syncmedia = require("./syncmedia");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Can only get media for files");
    assert(node.path, `Node with id ${node._id} seems to not be present in the tree, it has no path, can not cache media`);

    try {
        for (const size of media.requiredSizes) {
            await url(client, node.path, {
                width: size.width,
                height: size.height,
                type: size.type
            });
        }
    } catch (error) {
        node = await Node.resolve(client, node.path); // Resolve again to make sure we do not have a stale copy and overwrite something
        await node.update(client, { cacheError: error.stack.toString() }, true);
    }

    await syncmedia(client, abspath);
};
