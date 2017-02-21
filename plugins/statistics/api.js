"use strict";

const moment = require("moment");
const api = require("api.io");

let params = {};

const statistics = api.register("statistics", {
    deps: [ "vfs", "auth" ],
    init: async (config) => {
        params = config;
    },
    getEventData: api.export(async (/*session*/) => {
        let nodes = await api.vfs.query(api.auth.getAdminSession(), {
            "properties.type": "t",
            "attributes.type": { $in: [ "birth", "death", "engagement", "marriage" ] }
        }, {
            fields: {
                "attributes.time": 1,
                "attributes.type": 1
            }
        });

        let data = {
            birth: Array(12).fill(0),
            engagement: Array(12).fill(0),
            marriage: Array(12).fill(0),
            death: Array(12).fill(0)
        };

        for (let node of nodes) {
            if (!node.attributes.time) {
                continue;
            }

            if (node.attributes.time.quality === "utc" ||
                node.attributes.time.accuracy === "second" ||
                node.attributes.time.accuracy === "minute" ||
                node.attributes.time.accuracy === "hour" ||
                node.attributes.time.accuracy === "day" ||
                node.attributes.time.accuracy === "month") {
                let time = moment(node.attributes.time.timestamp * 1000);
                let month = parseInt(time.format("M"), 10) - 1;

                data[node.attributes.type][month]++;
            }
        }

        return data;
    })
});

module.exports = statistics;
