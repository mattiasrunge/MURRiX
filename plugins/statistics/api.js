"use strict";

const moment = require("moment");
const api = require("api.io");

const GIB_SCALE = Math.pow(1024, 3);

const statistics = api.register("statistics", {
    deps: [ "vfs", "auth" ],
    init: async (/* config */) => {
    },
    getNodeData: api.export(async (session, options) => {
        const data = {
            createdPerYear: {},
            fileSizeIncreasePerYear: {}
        };

        const result = await api.vfs.aggregate(api.auth.getAdminSession(), [
            {
                $match: {
                    "properties.type": "f"
                }
            },
            {
                $group: {
                    _id: {
                        $year: "$properties.birthtime"
                    },
                    total: {
                        $sum: "$attributes.size"
                    }
                }
            }
        ]);

        data.fileSizeIncreasePerYear = {
            labels: [],
            values: [],
            increase: []
        };

        let last = 0;

        for (const item of result.reverse()) {
            last += item.total;

            data.fileSizeIncreasePerYear.labels.push(item._id);
            data.fileSizeIncreasePerYear.values.push(item.total / GIB_SCALE);
            data.fileSizeIncreasePerYear.increase.push(last / GIB_SCALE);
        }

        if (options.types) {
            for (const type of options.types) {
                const result = await api.vfs.aggregate(api.auth.getAdminSession(), [
                    {
                        $match: {
                            "properties.type": type
                        }
                    },
                    {
                        $group: {
                            _id: {
                                $year: "$properties.birthtime"
                            },
                            total: {
                                $sum: 1
                            }
                        }
                    }
                ]);

                data.createdPerYear[type] = {
                    labels: [],
                    values: [],
                    increase: []
                };

                let last = 0;

                for (const item of result.reverse()) {
                    last += item.total;

                    data.createdPerYear[type].labels.push(item._id);
                    data.createdPerYear[type].values.push(item.total);
                    data.createdPerYear[type].increase.push(last);
                }
            }
        }

        return data;
    }),
    getEventData: api.export(async (/* session */) => {
        const nodes = await api.vfs.query(api.auth.getAdminSession(), {
            "properties.type": "t",
            "attributes.type": { $in: [ "birth", "death", "engagement", "marriage" ] }
        }, {
            fields: {
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
    })
});

module.exports = statistics;
