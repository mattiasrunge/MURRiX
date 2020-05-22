"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const log = require("../../../log")(module);
const media = require("../../../media");
const cachemedia = require("./cachemedia");

module.exports = async (client) => {
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

    if (count > 0) {
        log.info(`Task cache media found ${count} nodes that needs to be cached`);

        const list = await Node.query(client, query, {
            limit: 1,
            sort: { "properties.birthtime": -1 }
        });

        if (list[0]) {
            await cachemedia(client, list[0]);

            return true;
        }
    }

    return false;
};
