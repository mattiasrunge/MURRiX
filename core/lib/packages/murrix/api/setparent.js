"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { api } = require("../../../api");

module.exports = async (client, abspath, gender, parentpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "p", "Path is not a person");
    assert(gender === "f" || gender === "m", "Gender must be f or m");

    const parents = await api.list(client, `${abspath}/parents`);
    const parent = parents.find((parent) => parent.attributes.gender === gender);

    if (parent) {
        // Remove current parent symlink from parents
        await api.unlink(client, parent.extra.linkPath);

        // Remove child from parents children
        const children = await api.list(client, `${parent.path}/children`, { nofollow: true });
        const childLink = children.find((link) => link.attributes.path === abspath);
        await api.unlink(client, childLink.path);
    }

    if (parentpath) {
        await api.symlink(client, parentpath, `${abspath}/parents`);
        await api.symlink(client, abspath, `${parentpath}/children`);

        return api.resolve(client, parentpath);
    }

    return null;
};
