"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const log = require("../../../lib/log")(module);
const media = require("../../../media");
const { api } = require("../../../api");

module.exports = async (client, taskNode) => {
    assert(client.isAdmin(), "Permission denied");

    const query = {
        "properties.type": "f",
        "attributes.rawImage": { $ne: true },
        "attributes.cacheError": { $exists: false },
        "$or": [
            {
                "attributes.type": { $in: [ "image", "video", "audio" ] },
                "attributes.cached": { $exists: false }
            },
            {
                "attributes.type": { $in: [ "image", "document" ] },
                "attributes.cached": {
                    $not: {
                        $all: media.requiredSizes.map((s) => ({
                            $elemMatch: {
                                width: s.width || 0,
                                height: s.height || 0,
                                type: s.type || "image"
                            }
                        }))
                    }
                }
            },
            {
                "attributes.type": { $in: [ "video", "audio" ] },
                "attributes.cached": {
                    $not: {
                        $all: media.requiredSizes.map((s) => ({
                            $elemMatch: {
                                width: s.width || 0,
                                height: s.height || 0,
                                type: s.type || "video"
                            }
                        }))
                    }
                }
            }
        ]
    };

    const count = await Node.count(client, query);

    await api.update(client, taskNode.path, { nodesLeft: count });

    if (count > 0) {
        log.info(`Task cache media found ${count} nodes that needs to be processed`);

        const list = await Node.query(client, query, {
            limit: 1,
            sort: { "properties.birthtime": -1 }
        });

        if (list[0]) {
            let node = list[0];

            if (!node.path) {
                log.info(`Node with id ${node._id} seems to not be present in the tree, it has no path, will run found on it`);

                node = await api.found(client, node);
            }

            await api.cachemedia(client, node);

            return true;
        }
    }

    return false;
};
