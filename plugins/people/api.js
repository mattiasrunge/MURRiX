"use strict";

const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const vfs = require("../vfs/api");
const auth = require("../auth/api");

let params = {};

let people = api.register("people", {
    deps: [ "vfs", "auth" ],
    init: co(function*(config) {
        params = config;

        if (!(yield vfs.resolve(auth.getAdminSession(), "/people", true))) {
            yield vfs.create(auth.getAdminSession(), "/people", "d");
            yield vfs.chown(auth.getAdminSession(), "/people", "admin", "users");
        }
    }),
    mkperson: function*(session, name, attributes) {
        let person = yield vfs.create(session, "/people/" + name, "p", attributes);

        yield vfs.create(session, "/people/" + name + "/parents", "d");
        yield vfs.create(session, "/people/" + name + "/children", "d");
        yield vfs.create(session, "/people/" + name + "/homes", "d");
        yield vfs.create(session, "/people/" + name + "/measurments", "d");
        yield vfs.create(session, "/people/" + name + "/texts", "d");

        return yield vfs.resolve(session, "/people/" + name);
    },
    getMetrics: function*(session, abspath) {
        let node = yield vfs.resolve(session, abspath);
        let birthdate = false;
        let deathdate = false;
        let age = false;
        let ageatdeath = false;

        let birth = (yield vfs.list(session, abspath + "/texts", false, {
            "attributes.type": "birth"
        }))[0];

        let death = (yield vfs.list(session, abspath + "/texts", false, {
            "attributes.type": "death"
        }))[0];

        if (birth) {
            let birthUtc = moment.utc(birth.node.attributes.time.timestamp * 1000);

            birthdate = birthUtc.format("YYYY-MM-DD");
            age = moment.utc().diff(birthUtc, "years");
        }

        if (death) {
            let deathUtc = moment.utc(death.node.attributes.time.timestamp * 1000);

            deathdate = deathUtc.format("YYYY-MM-DD");

            if (birth) {
                let birthUtc = moment.utc(birth.node.attributes.time.timestamp * 1000);

                ageatdeath = deathUtc.diff(birthUtc.utc(), "years");
            }
        }

        return { birthdate: birthdate, age: age, deathdate: deathdate, ageatdeath: ageatdeath };
    },
    addMeasurement: function*(session, abspath, name, time, value, unit) {
        let node = yield vfs.resolve(session, abspath + "/measurments/" + name, true);
        // TODO: Use vfs.ensure here instead
        if (!node) {
            node = yield vfs.create(session, abspath + "/measurments/" + name, "c", {
                values: []
            });
        }

        node.attributes.values.push({ time: time, value: value, unit: unit });

        yield vfs.setattributes(session, abspath + "/measurments/" + name, {
            values: node.attributes.values
        });
    },
    find: function*(session, name) {
        return yield vfs.resolve(session, "/people/" + name, true);
    }
});

module.exports = people;
