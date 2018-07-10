"use strict";

const assert = require("assert");
const { v4: uuid } = require("uuid");
const db = require("../../lib/db");
const Node = require("../lib/Node");

class Root extends Node {
    // Private

    static async _createData() {
        return {
            _id: uuid(),
            properties: {
                type: "r",
                mode: 0o775,
                birthtime: new Date(),
                birthuid: 1000,
                ctime: new Date(),
                cuid: 1000,
                mtime: new Date(),
                muid: 1000,
                uid: 1000,
                gid: 1000,
                acl: [],
                children: [],
                count: 0
            },
            attributes: {
                labels: []
            }
        };
    }


    // Setters

    static async create(session) {
        assert(session.almighty || session.username === "admin" || session.admin, "Permission denied");

        const node = await Root._createData();
        const nodepath = Node._factory(node.properties.type, {
            ...node,
            name: null,
            path: "/"
        });

        await db.insertOne("nodes", nodepath._serializeForDb());
        await nodepath.constructor._ensureIndexes();

        nodepath._notify(session, "create");

        return nodepath;
    }
}

Root.IDENTIFIER = "r";
Root.VERSION = 1;

module.exports = Root;