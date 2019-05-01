"use strict";

const assert = require("assert");
const { isGuest, ADMIN_SESSION } = require("../../../core/auth");
const aggregate = require("../../vfs/commands/aggregate");

const GIB_SCALE = Math.pow(1024, 3);

module.exports = async (session, options) => {
    assert(!isGuest(session), "Permission denied");

    const data = {
        createdPerYear: {},
        fileSizeIncreasePerYear: {}
    };

    const result = await aggregate(ADMIN_SESSION, [
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

    const list = result.map((item) => ({
        ...item,
        year: parseInt(item._id, 10)
    }));

    data.fileSizeIncreasePerYear = {
        labels: [],
        values: [],
        increase: []
    };

    let last = 0;

    const completeList = [];
    const minYear = Math.min(...list.map(({ year }) => year));
    const maxYear = new Date().getFullYear();

    for (let year = minYear; year <= maxYear; year++) {
        const item = list.find((item) => item.year === year) || {
            _id: year,
            year,
            total: 0
        };

        completeList.push(item);
    }

    for (const item of completeList) {
        last += item.total;

        data.fileSizeIncreasePerYear.labels.push(item.year);
        data.fileSizeIncreasePerYear.values.push(item.total / GIB_SCALE);
        data.fileSizeIncreasePerYear.increase.push(last / GIB_SCALE);
    }

    if (options.types) {
        for (const type of options.types) {
            const result = await aggregate(ADMIN_SESSION, [
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

            const list = result.map((item) => ({
                ...item,
                year: parseInt(item._id, 10)
            }));

            data.createdPerYear[type] = {
                labels: [],
                values: [],
                increase: []
            };

            let last = 0;

            const completeList = [];
            const minYear = Math.min(...list.map(({ year }) => year));
            const maxYear = new Date().getFullYear();

            for (let year = minYear; year <= maxYear; year++) {
                const item = list.find((item) => item.year === year) || {
                    _id: year,
                    year,
                    total: 0
                };

                completeList.push(item);
            }

            for (const item of completeList) {
                last += item.total;

                data.createdPerYear[type].labels.push(item.year);
                data.createdPerYear[type].values.push(item.total);
                data.createdPerYear[type].increase.push(last);
            }
        }
    }

    return data;
};
