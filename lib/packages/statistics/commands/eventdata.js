"use strict";

const assert = require("assert");
const moment = require("moment");
const { isGuest, ADMIN_SESSION } = require("../../../core/auth");
const query = require("../../../packages/vfs/commands/query");

module.exports = async (session) => {
    assert(!isGuest(session), "Permission denied");

    const nodes = await query(ADMIN_SESSION, {
        "properties.type": "t",
        "attributes.type": { $in: [ "birth", "death", "engagement", "marriage" ] }
    }, {
        projection: {
            "attributes.time": 1,
            "attributes.type": 1
        }
    });

    const data = {
        birth: Array(12).fill(0),
        engagement: Array(12).fill(0),
        marriage: Array(12).fill(0),
        death: Array(12).fill(0)
    };

    for (const node of nodes) {
        if (!node.attributes.time) {
            continue;
        }

        if (node.attributes.time.quality === "utc" ||
            node.attributes.time.accuracy === "second" ||
            node.attributes.time.accuracy === "minute" ||
            node.attributes.time.accuracy === "hour" ||
            node.attributes.time.accuracy === "day" ||
            node.attributes.time.accuracy === "month") {
            const time = moment(node.attributes.time.timestamp * 1000);
            const month = parseInt(time.format("M"), 10) - 1;

            data[node.attributes.type][month]++;
        }
    }

    return data;
};
