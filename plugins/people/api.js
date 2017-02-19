"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const bus = require("../../core/lib/bus");

let params = {};

let people = api.register("people", {
    deps: [ "vfs", "auth" ],
    init: co(function*(config) {
        params = config;

        if (!(yield api.vfs.resolve(api.auth.getAdminSession(), "/people", { noerror: true }))) {
            yield api.vfs.create(api.auth.getAdminSession(), "/people", "d");
            yield api.vfs.chown(api.auth.getAdminSession(), "/people", "admin", "users");
        }
    }),
    mkperson: function*(session, name, attributes) {
        let abspath = path.join("/people", name);

        yield api.vfs.create(session, abspath, "p", attributes);

        yield api.vfs.create(session, path.join(abspath, "parents"), "d");
        yield api.vfs.create(session, path.join(abspath, "children"), "d");
        yield api.vfs.create(session, path.join(abspath, "homes"), "d");
        yield api.vfs.create(session, path.join(abspath, "measurments"), "d");
        yield api.vfs.create(session, path.join(abspath, "texts"), "d");

        bus.emit("people.new", {
            uid: session.uid,
            path: abspath,
            name: attributes.name
        });

        return yield api.vfs.resolve(session, abspath);
    },
    getParent: function*(session, abspath, gender = "f") {
        let parentpath = path.join(abspath, "parents");
        let list = yield api.vfs.list(session, parentpath);

        return list.find((item) => item.node.attributes.gender === gender) || false;
    },
    setParent: function*(session, abspath, parentpath, gender) {
        const currentParent = yield people.getParent(session, abspath, gender);
        const childNodepath = yield api.vfs.resolve(session, abspath, { nodepath: true });

        if (currentParent) {
            // Remove current parent symlink from parents
            const curretParentPath = path.join(abspath, "parents", currentParent.name);
            console.log("Unlink", curretParentPath);
            yield api.vfs.unlink(session, curretParentPath);

            // Remove child from parents current parents children
            const currentChildPath = path.join(currentParent.path, "children", childNodepath.name);
            console.log("Unlink", currentChildPath);
            yield api.vfs.unlink(session, currentChildPath);
        }

        if (parentpath) {
            const newParentNodepath = yield api.vfs.resolve(session, parentpath, { nodepath: true });

            const newParentPath = path.join(abspath, "parents");
            console.log("Link", parentpath, newParentPath);
            yield api.vfs.symlink(session, parentpath, newParentPath);

            const newChildPath = path.join(newParentNodepath.path, "children");
            console.log("Link", abspath, newChildPath);
            yield api.vfs.symlink(session, abspath, newChildPath);
        }
    },
    getPartner: function*(session, abspath) {
        let partnerpath = path.join(abspath, "partner");
        let node = yield api.vfs.resolve(session, partnerpath, { noerror: true, nofollow: true });

        if (!node) {
            return false;
        }

        if (node && node.properties.type === "s") {
            partnerpath = node.attributes.path;
            node = yield api.vfs.resolve(session, partnerpath);
        }

        let editable = yield api.vfs.access(session, partnerpath, "w");

        return { path: partnerpath, node: node, editable: editable };
    },
    setPartner: function*(session, abspath, partnerpath) {
        let currentPartner = yield people.getPartner(session, abspath);

        // Remove current partners partner symlink
        if (currentPartner) {
            console.log(currentPartner.path);
            // It is assumed that the currentPartners link points to abspath
            yield api.vfs.unlink(session, path.join(currentPartner.path, "partner"));
        }

        // Remove new partners existing partner
        if (partnerpath) {
            yield api.vfs.unlink(session, path.join(partnerpath, "partner"));
        }

        // Remove partner link
        yield api.vfs.unlink(session, path.join(abspath, "partner"));


        // Create new partner links
        if (partnerpath) {
            yield api.vfs.symlink(session, abspath, path.join(partnerpath, "partner"));
            yield api.vfs.symlink(session, partnerpath, path.join(abspath, "partner"));
        }
    },
    getMetrics: function*(session, abspath) {
        let birthdate = false;
        let deathdate = false;
        let age = false;
        let ageatdeath = false;

        let birth = (yield api.vfs.list(session, abspath + "/texts", { filter: {
            "attributes.type": "birth"
        } }))[0];

        let death = (yield api.vfs.list(session, abspath + "/texts", { filter: {
            "attributes.type": "death"
        } }))[0];

        if (birth && birth.node.attributes.time) {
            let birthUtc = moment.utc(birth.node.attributes.time.timestamp * 1000);

            birthdate = birthUtc.format("YYYY-MM-DD");
            age = moment.utc().diff(birthUtc, "years");
        }

        if (death && death.node.attributes.time) {
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
        let node = yield api.vfs.ensure(api.auth.getAdminSession(), path.join(abspath, "measurments", name), "v", {
            values: []
        });

        node.attributes.values.push({ time: time, value: value, unit: unit });

        yield api.vfs.setattributes(session, abspath + "/measurments/" + name, {
            values: node.attributes.values
        });
    },
    find: function*(session, name) {
        return yield api.vfs.resolve(session, "/people/" + name, { noerror: true });
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

        let sNodes = yield api.vfs.query(session, query, options);
        let sIds = sNodes.map((node) => node._id);

        console.timeEnd("people.findByTags sIds");
        console.time("people.findByTags dIds");

        query = {
            "properties.type": "d",
            "properties.children.id": { $in: sIds }
        };

        let dNodes = yield api.vfs.query(session, query, options);
        let dIds = dNodes.map((node) => node._id);

        console.timeEnd("people.findByTags dIds");
        console.time("people.findByTags fNodes");

        query = {
            "properties.type": "f",
            "properties.children.id": { $in: dIds }
        };

        let fNodes = yield api.vfs.query(session, query);

        console.timeEnd("people.findByTags fNodes");
        console.time("people.findByTags lookup");

        for (let node of fNodes) {
            let paths = yield api.vfs.lookup(session, node._id, cache);

            list.push({ name: path.basename(paths[0]), node: node, path: paths[0] });
        }

        console.timeEnd("people.findByTags lookup");
        console.timeEnd("people.findByTags total " + abspath);

        return list;
    }
});

module.exports = people;
