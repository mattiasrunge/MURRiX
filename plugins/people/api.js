"use strict";

const path = require("path");
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
        yield vfs.create(session, "/people/" + name, "p", attributes);

        yield vfs.create(session, "/people/" + name + "/parents", "d");
        yield vfs.create(session, "/people/" + name + "/children", "d");
        yield vfs.create(session, "/people/" + name + "/homes", "d");
        yield vfs.create(session, "/people/" + name + "/measurments", "d");
        yield vfs.create(session, "/people/" + name + "/texts", "d");

        plugin.emit("people.new", {
            uid: session.uid,
            path: abspath,
            name: attributes.name
        });

        return yield vfs.resolve(session, "/people/" + name);
    },
    getPartner: function*(session, abspath) {
        let partnerpath = path.join(abspath, "partner");
        let node = yield vfs.resolve(session, partnerpath, true, true);

        if (!node) {
            return false;
        }

        if (node && node.properties.type === "s") {
            partnerpath = node.attributes.path;
            node = yield vfs.resolve(session, partnerpath);
        }

        let editable = yield vfs.access(session, partnerpath, "w");

        return { path: partnerpath, node: node, editable: editable };
    },
    setPartner: function*(session, abspath, partnerpath) {
        let currentPartner = yield people.getPartner(session, abspath);

        // Remove current partners partner symlink
        if (currentPartner) {
            console.log(currentPartner.path);
            // It is assumed that the currentPartners link points to abspath
            yield vfs.unlink(session, path.join(currentPartner.path, "partner"));
        }

        // Remove new partners existing partner
        if (partnerpath) {
            yield vfs.unlink(session, path.join(partnerpath, "partner"));
        }

        // Remove partner link
        yield vfs.unlink(session, path.join(abspath, "partner"));


        // Create new partner links
        if (partnerpath) {
            yield vfs.symlink(session, abspath, path.join(partnerpath, "partner"));
            yield vfs.symlink(session, partnerpath, path.join(abspath, "partner"));
        }
    },
    getMetrics: function*(session, abspath) {
        let birthdate = false;
        let deathdate = false;
        let age = false;
        let ageatdeath = false;

        let birth = (yield vfs.list(session, abspath + "/texts", { filter: {
            "attributes.type": "birth"
        } }))[0];

        let death = (yield vfs.list(session, abspath + "/texts", { filter: {
            "attributes.type": "death"
        } }))[0];

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
        let node = yield vfs.ensure(auth.getAdminSession(), path.join(abspath, "measurments", name), "v", {
            values: []
        });

        node.attributes.values.push({ time: time, value: value, unit: unit });

        yield vfs.setattributes(session, abspath + "/measurments/" + name, {
            values: node.attributes.values
        });
    },
    find: function*(session, name) {
        return yield vfs.resolve(session, "/people/" + name, true);
    },
    findByTags: function*(session, abspath) {
        console.time("people.findByTags total " + abspath);
        console.time("people.findByTags sIds");

        let list = [];
        let cache = {};

        let options = {
            fields: {
                "_id": 1
            }
        };

        let query = {
            "properties.type": { $in: [ "s" ] },
            "attributes.path": abspath
        };

        let sNodes = yield vfs.query(session, query, options);
        let sIds = sNodes.map((node) => node._id);

        console.timeEnd("people.findByTags sIds");
        console.time("people.findByTags dIds");

        query = {
            "properties.type": "d",
            "properties.children.id": { $in: sIds }
        };

        let dNodes = yield vfs.query(session, query, options);
        let dIds = dNodes.map((node) => node._id);

        console.timeEnd("people.findByTags dIds");
        console.time("people.findByTags fNodes");

        query = {
            "properties.type": "f",
            "properties.children.id": { $in: dIds }
        };

        let fNodes = yield vfs.query(session, query);

        console.timeEnd("people.findByTags fNodes");
        console.time("people.findByTags lookup");

        for (let node of fNodes) {
            let paths = yield vfs.lookup(session, node._id, cache);

            list.push({ name: path.basename(paths[0]), node: node, path: paths[0] });
        }

        console.timeEnd("people.findByTags lookup");
        console.timeEnd("people.findByTags total " + abspath);

        return list;
    }
});

module.exports = people;
