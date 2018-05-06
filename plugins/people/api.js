"use strict";

const path = require("path");
const moment = require("moment");
const api = require("api.io");
const bus = require("../../lib/bus");

let params = {};

const people = api.register("people", {
    deps: [ "vfs", "auth" ],
    init: async (config) => {
        params = config;

        if (!(await api.vfs.resolve(api.auth.getAdminSession(), "/people", { noerror: true }))) {
            await api.vfs.create(api.auth.getAdminSession(), "/people", "d");
            await api.vfs.chown(api.auth.getAdminSession(), "/people", "admin", "users");
        }
    },
    mkperson: api.export(async (session, name, attributes) => {
        let abspath = path.join("/people", name);

        await api.vfs.create(session, abspath, "p", attributes);

        await api.vfs.create(session, path.join(abspath, "parents"), "d");
        await api.vfs.create(session, path.join(abspath, "children"), "d");
        await api.vfs.create(session, path.join(abspath, "homes"), "d");
        await api.vfs.create(session, path.join(abspath, "measurments"), "d");
        await api.vfs.create(session, path.join(abspath, "texts"), "d");

        bus.emit("people.new", {
            uid: session.uid,
            path: abspath,
            name: attributes.name
        });

        return await api.vfs.resolve(session, abspath);
    }),
    getParent: api.export(async (session, abspath, gender = "f") => {
        let parentpath = path.join(abspath, "parents");
        let list = await api.vfs.list(session, parentpath);

        return list.find((item) => item.node.attributes.gender === gender) || false;
    }),
    setParent: api.export(async (session, abspath, parentpath, gender) => {
        const currentParent = await people.getParent(session, abspath, gender);
        const childNodepath = await api.vfs.resolve(session, abspath, { nodepath: true });

        if (currentParent) {
            // Remove current parent symlink from parents
            const curretParentPath = path.join(abspath, "parents", currentParent.name);
            console.log("Unlink", curretParentPath);
            await api.vfs.unlink(session, curretParentPath);

            // Remove child from parents current parents children
            const currentChildPath = path.join(currentParent.path, "children", childNodepath.name);
            console.log("Unlink", currentChildPath);
            await api.vfs.unlink(session, currentChildPath);
        }

        if (parentpath) {
            const newParentNodepath = await api.vfs.resolve(session, parentpath, { nodepath: true });

            const newParentPath = path.join(abspath, "parents");
            console.log("Link", parentpath, newParentPath);
            await api.vfs.symlink(session, parentpath, newParentPath);

            const newChildPath = path.join(newParentNodepath.path, "children");
            console.log("Link", abspath, newChildPath);
            await api.vfs.symlink(session, abspath, newChildPath);
        }
    }),
    getPartner: api.export(async (session, abspath) => {
        let partnerpath = path.join(abspath, "partner");
        let node = await api.vfs.resolve(session, partnerpath, { noerror: true, nofollow: true });

        if (!node) {
            return false;
        }

        if (node && node.properties.type === "s") {
            partnerpath = node.attributes.path;
            node = await api.vfs.resolve(session, partnerpath);
        }

        let editable = await api.vfs.access(session, partnerpath, "w");

        return { path: partnerpath, node: node, editable: editable };
    }),
    setPartner: api.export(async (session, abspath, partnerpath) => {
        let currentPartner = await people.getPartner(session, abspath);

        // Remove current partners partner symlink
        if (currentPartner) {
            console.log(currentPartner.path);
            // It is assumed that the currentPartners link points to abspath
            await api.vfs.unlink(session, path.join(currentPartner.path, "partner"));
        }

        // Remove new partners existing partner
        if (partnerpath) {
            await api.vfs.unlink(session, path.join(partnerpath, "partner"));
        }

        // Remove partner link
        await api.vfs.unlink(session, path.join(abspath, "partner"));


        // Create new partner links
        if (partnerpath) {
            await api.vfs.symlink(session, abspath, path.join(partnerpath, "partner"));
            await api.vfs.symlink(session, partnerpath, path.join(abspath, "partner"));
        }
    }),
    getMetrics: api.export(async (session, abspath) => {
        let birthdate = false;
        let deathdate = false;
        let age = false;
        let ageatdeath = false;

        let birth = (await api.vfs.list(session, abspath + "/texts", { filter: {
            "attributes.type": "birth"
        } }))[0];

        let death = (await api.vfs.list(session, abspath + "/texts", { filter: {
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
    }),
    addMeasurement: api.export(async (session, abspath, name, time, value, unit) => {
        let node = await api.vfs.ensure(api.auth.getAdminSession(), path.join(abspath, "measurments", name), "v", {
            values: []
        });

        node.attributes.values.push({ time: time, value: value, unit: unit });

        await api.vfs.setattributes(session, abspath + "/measurments/" + name, {
            values: node.attributes.values
        });
    }),
    find: api.export(async (session, name) => {
        return await api.vfs.resolve(session, "/people/" + name, { noerror: true });
    }),
    findByTags: api.export(async (session, abspath, opts = {}) => {
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

        let sNodes = await api.vfs.query(session, query, options);
        let sIds = sNodes.map((node) => node._id);

        console.timeEnd("people.findByTags sIds");
        console.time("people.findByTags dIds");

        query = {
            "properties.type": "d",
            "properties.children.id": { $in: sIds }
        };

        let dNodes = await api.vfs.query(session, query, options);
        let dIds = dNodes.map((node) => node._id);

        console.timeEnd("people.findByTags dIds");
        console.time("people.findByTags fNodes");

        query = {
            "properties.type": "f",
            "properties.children.id": { $in: dIds }
        };

        let fNodes = await api.vfs.query(session, query);

        console.timeEnd("people.findByTags fNodes");
        console.time("people.findByTags lookup");

        for (let node of fNodes) {
            let paths = await api.vfs.lookup(session, node._id, cache);

            list.push({ name: path.basename(paths[0]), node: node, path: paths[0] });
        }

        console.timeEnd("people.findByTags lookup");
        console.timeEnd("people.findByTags total " + abspath);

        if (opts.image) {
            const ids = list.map((nodepath) => nodepath.node._id);

            const urls = await api.file.getMediaUrl(session, ids, opts.image);

            for (const nodepath of list) {
                nodepath.filename = urls[nodepath.node._id] || false;
            }
        }

        return list;
    })
});

module.exports = people;
