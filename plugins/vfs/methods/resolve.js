"use strict";

const path = require("path");
const db = require("../../../lib/db");
const access = require("./access");

const assert = (expression, message) => {
    if (!expression) {
        throw new Error(message);
    }
};

const getFindOpts = (pathParts) => {
    if (pathParts.length === 0) {
        return {};
    }

    return {
        fields: {
            "properties.mode": 1,
            "properties.uid": 1,
            "properties.gid": 1,
            "properties.acl": 1,
            "properties.children": 1,
            "attributes.path": 1
        }
    };
};

const resolve = async (session, abspath, options = {}) => {
    if (typeof abspath !== "string") {
        return abspath;
    }

    const getchild = async (session, node, pathParts, childName, options) => {
        if (pathParts.length === 0) {
            assert(await access(session, node, "r"), "Permission denied");

            if (options.nodepath) {
                return {
                    name: childName,
                    node: node,
                    path: abspath,
                    editable: await access(session, node, "w")
                };
            }

            return node;
        }

        const name = pathParts.shift();
        const child = node.properties.children.find((child) => child.name === name);

        assert(child, `No such (abspath=${abspath}) path: ${pathParts.join(":")}`);

        node = await db.findOne("nodes", { _id: child.id }, getFindOpts(pathParts));

        assert(await access(session, node, "x"), "Permission denied");

        if (node.properties.type === "s" && !options.nofollow) {
            return resolve(session, path.join(node.attributes.path, pathParts.join("/")), options);
        }

        return getchild(session, node, pathParts, child.name, options);
    };

    try {
        const pathParts = abspath.replace(/\/$/g, "").split("/");
        pathParts.shift();

        const root = await db.findOne("nodes", { "properties.type": "r" }, getFindOpts(pathParts));

        return await getchild(session, root, pathParts, "", options);
    } catch (error) {
        if (options.noerror) {
            return false;
        }

        throw error;
    }
};

module.exports = resolve;
