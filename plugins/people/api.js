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

        return person;
    },
    addMeasurement: function*(session, abspath, name, time, value, unit) {
        let node = yield vfs.resolve(session, abspath + "/measurments/" + name, true);

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
