"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const resolve = require("../../vfs/commands/resolve");
const list = require("../../vfs/commands/list");
const unlink = require("../../vfs/commands/unlink");
const symlink = require("../../vfs/commands/symlink");

module.exports = async (client, abspath, gender, parentpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "p", "Path is not a person");
    assert(gender === "f" || gender === "m", "Gender must be f or m");

    const parents = await list(client, `${abspath}/parents`);
    const parent = parents.find((parent) => parent.attributes.gender === gender);

    if (parent) {
        // Remove current parent symlink from parents
        await unlink(client, parent.extra.linkPath);

        // Remove child from parents children
        const children = await list(client, `${parent.path}/children`, { nofollow: true });
        const childLink = children.find((link) => link.attributes.path === abspath);
        await unlink(client, childLink.path);
    }

    if (parentpath) {
        await symlink(client, parentpath, `${abspath}/parents`);
        await symlink(client, abspath, `${parentpath}/children`);

        return resolve(client, parentpath);
    }

    return null;
};
