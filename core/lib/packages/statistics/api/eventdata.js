"use strict";

const assert = require("assert");
const moment = require("moment");
const { ADMIN_CLIENT } = require("../../../lib/auth");
const { api } = require("../../../api");

module.exports = async (client) => {
    assert(!client.isGuest(), "Permission denied");

    const nodes = await api.query(ADMIN_CLIENT, {
        "properties.type": "t",
        "attributes.type": { $in: [ "birth", "death", "engagement", "marriage" ] }
    }, {
        projection: {
            "attributes.time": 1,
            "attributes.type": 1
        }
    });

    const data = {
        birth: new Array(12).fill(0),
        engagement: new Array(12).fill(0),
        marriage: new Array(12).fill(0),
        death: new Array(12).fill(0)
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
            const month = Number.parseInt(time.format("M"), 10) - 1;

            data[node.attributes.type][month]++;
        }
    }

    return data;
};
