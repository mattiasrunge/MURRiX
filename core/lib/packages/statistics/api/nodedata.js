"use strict";

const assert = require("assert");
const { ADMIN_CLIENT } = require("../../../auth");
const { api } = require("../../../api");

const GIB_SCALE = 1024 ** 3;

module.exports = async (client, options) => {
    assert(!client.isGuest(), "Permission denied");

    const data = {
        createdPerYear: {},
        fileSizeIncreasePerYear: {}
    };

    const result = await api.aggregate(ADMIN_CLIENT, [
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
        year: Number.parseInt(item._id, 10)
    }));

    data.fileSizeIncreasePerYear = {
        labels: [],
        values: [],
        totals: []
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
        data.fileSizeIncreasePerYear.totals.push(last / GIB_SCALE);
    }

    if (options.types) {
        for (const type of options.types) {
            const result = await api.aggregate(ADMIN_CLIENT, [
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
                year: Number.parseInt(item._id, 10)
            }));

            data.createdPerYear[type] = {
                labels: [],
                values: [],
                totals: []
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
                data.createdPerYear[type].totals.push(last);
            }
        }
    }

    return data;
};
