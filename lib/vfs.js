"use strict";

const co = require("bluebird").coroutine;
const db = require("./db");
const uuid = require("node-uuid");
const path = require("path");

module.exports = {
    init: co(function*() {
        let query = {
            "properties.name": "",
            "properties.parents.0": { $exists: false }
        };

        let node = yield db.findOne("nodes", query);

        if (!node) {
            console.log("No root node found, creating...");

            let node = {
                _id: uuid.v4(),
                properties: {
                    name: "",
                    type: "d",
                    access: {
                        owner: "rwx",
                        group: "rwx",
                        all: "r-x"
                    },
                    owner: "admin",
                    group: "admin",
                    parents: [ ]
                },
                attributes: {}
            };

            yield db.insertOne("nodes", node);
        }
    }),
    resolve: co(function*(session, dir) {
        let parts = dir.replace(/\/$/g, "").split("/");
        let node = null;

        for (let name of parts) {
            let query = {
                "properties.name": name
            };

            if (node) {
                query["properties.parents"] = { $in: [ node._id ] };
            } else {
                query["properties.parents.0"] = { $exists: false };
            }

            node = yield db.findOne("nodes", query);

            if (!node) {
                break;
            }
        }

        return node;
    }),
    list: co(function*(session, dir) {
        let parent = yield module.exports.resolve(session, dir);

        if (!parent) {
            throw new Error("Invalid path " + dir);
        }

        return yield db.find("nodes", { "properties.parents": { $in: [ parent._id ] } });
    }),
    create: co(function*(session, dir, type) {
        let parent = yield module.exports.resolve(session, path.dirname(dir));

        if (!parent) {
            throw new Error("Invalid path " + dir);
        }

        let node = yield module.exports.resolve(session, dir);

        if (node) {
            throw new Error(name + " already exists");
        }

        node = {
            _id: uuid.v4(),
            properties: {
                name: path.basename(dir),
                type: type,
                access: {
                    owner: "rwx",
                    group: "rwx",
                    all: "r-x"
                },
                owner: session.username,
                group: session.groups[0],
                parents: [ parent._id ]
            },
            attributes: {}
        };

        return yield db.insertOne("nodes", node);
    }),
    remove: co(function*(session, dir) {
        let node = yield module.exports.resolve(session, dir);

        if (!node) {
            throw new Error("Invalid path " + dir);
        }

        let removeRec = co(function*(parent) {
            let nodes = yield db.find("nodes", { "properties.parents": { $in: [ parent._id ] } });

            for (let node of nodes) {
                if (node.properties.parents.length === 1) {
                    yield removeRec(node);
                } else {
                    let index = node.properties.parents.indexOf(parent._id);

                    if (index !== -1) {
                        node.properties.parents.splice(index, 1);
                    }

                    yield db.updateOne("nodes", node);
                }
            }

            yield db.removeOne("nodes", parent._id);
        });

        yield removeRec(node);
    }),
    move: co(function*(session, from, to) {
        let parent = yield module.exports.resolve(session, path.dirname(from));
        let src = yield module.exports.resolve(session, from);

        if (!src) {
            throw new Error("Invalid path " + from);
        }

        let dest = yield module.exports.resolve(session, to);

        if (!dest) {
            dest = yield module.exports.resolve(session, path.dirname(to));
            src.properties.name = path.basename(to);

            if (!dest) {
                throw new Error("Invalid path " + to);
            }
        }

        let index = src.properties.parents.indexOf(parent._id);

        if (index !== -1) {
            src.properties.parents.splice(index, 1);
        }

        src.properties.parents.push(dest._id);

        return yield db.updateOne("nodes", src);
    }),
    copy: co(function*(session, from, to) {
        let src = yield module.exports.resolve(session, from);

        if (!src) {
            throw new Error("Invalid path " + from);
        }

        let parent = yield module.exports.resolve(session, path.dirname(to));

         if (!parent) {
            throw new Error("Invalid path " + path.dirname(to));
        }

        let dest = yield module.exports.resolve(session, to);

        if (dest) {
            throw new Error(to + " already exists");
        }

        src._id = uuid.v4();
        src.properties.name = path.basename(to);
        src.properties.parents = [ parent._id ]
        src.properties.owner = session.username;
        src.properties.group = session.groups[0];

        // TODO: copy recursive

        return yield db.insertOne("nodes", src);

    })
};
