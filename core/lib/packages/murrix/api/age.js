"use strict";

const moment = require("moment");
const Node = require("../../../core/Node");
const { api } = require("../../../api");

const formatDate = (time) => {
    if (!time) {
        return;
    }

    if (typeof time === "string") {
        return time;
    }

    const date = moment.utc(time.timestamp * 1000);

    if (time.accuracy === "month") {
        return date.format("YYYY-MM");
    } else if (time.accuracy === "year") {
        return date.format("YYYY");
    }

    return date.format("YYYY-MM-DD");
};

module.exports = async (client, abspath, nowTime) => {
    const age = {};
    let birth;
    let death;
    const node = await api.resolve(client, abspath, { noerror: true });

    if (!node) {
        return age;
    }

    if (node.properties.type === "p") {
        birth = (await Node.list(client, `${abspath}/texts`, {
            query: {
                "attributes.type": "birth"
            },
            opts: {
                limit: 1
            }
        }))[0];

        death = (await Node.list(client, `${abspath}/texts`, {
            query: {
                "attributes.type": "death"
            },
            opts: {
                limit: 1
            }
        }))[0];
    } else if (node.properties.type === "a") {
        birth = (await Node.list(client, `${abspath}/files`, {
            query: {
                "attributes.time.timestamp": { $ne: null }
            },
            opts: {
                sort: {
                    "attributes.time.timestamp": 1
                },
                limit: 1
            }
        }))[0];

        death = (await Node.list(client, `${abspath}/files`, {
            query: {
                "attributes.time.timestamp": { $ne: null }
            },
            opts: {
                sort: {
                    "attributes.time.timestamp": -1
                },
                limit: 1
            }
        }))[0];
    }

    if (birth && birth.attributes.time) {
        const birthUtc = moment.utc(birth.attributes.time.timestamp * 1000);
        const nowDate = formatDate(nowTime);

        age.birthdate = formatDate(birth.attributes.time);
        age.age = moment.utc(nowDate).diff(birthUtc, "years");
        age.months = moment.utc(nowDate).diff(birthUtc, "months") % 12;
    }

    if (death && death.attributes.time) {
        const deathUtc = moment.utc(death.attributes.time.timestamp * 1000);
        const deathdate = formatDate(death.attributes.time);

        if (age.birthdate !== deathdate || node.properties.type === "p") {
            age.deathdate = deathdate;
        }

        if (birth && birth.attributes.time) {
            const birthUtc = moment.utc(birth.attributes.time.timestamp * 1000);

            age.ageatdeath = deathUtc.diff(birthUtc.utc(), "years");
        }
    }

    return age;
};
