"use strict";

const moment = require("moment");
const { Node } = require("../../vfs");
const resolve = require("../../vfs/commands/resolve");

const formatDate = (time) => {
    const date = moment.utc(time.timestamp * 1000);

    if (time.accuracy === "month") {
        return date.format("YYYY-MM");
    } else if (time.accuracy === "year") {
        return date.format("YYYY");
    }

    return date.format("YYYY-MM-DD");
};

module.exports = async (session, abspath) => {
    const age = {};
    let birth;
    let death;
    const node = await resolve(session, abspath, { noerror: true });

    if (!node) {
        return age;
    }

    if (node.properties.type === "p") {
        birth = (await Node.list(session, `${abspath}/texts`, {
            query: {
                "attributes.type": "birth"
            },
            opts: {
                limit: 1
            }
        }))[0];

        death = (await Node.list(session, `${abspath}/texts`, {
            query: {
                "attributes.type": "death"
            },
            opts: {
                limit: 1
            }
        }))[0];
    } else if (node.properties.type === "a") {
        birth = (await Node.list(session, `${abspath}/files`, {
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

        death = (await Node.list(session, `${abspath}/files`, {
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

        age.birthdate = formatDate(birth.attributes.time);
        age.age = moment.utc().diff(birthUtc, "years");
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
