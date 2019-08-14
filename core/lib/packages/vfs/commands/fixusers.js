"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../core/auth");
const ensure = require("./ensure");

module.exports = async (client) => {
    assert(client.isAdmin(), "Permission denied");

    const userdir = await Node.resolve(ADMIN_CLIENT, "/users");

    await userdir.chmod(ADMIN_CLIENT, 0o771);

    const users = await Node.list(ADMIN_CLIENT, "/users");

    for (const user of users) {
        await user.chown(ADMIN_CLIENT, user.attributes.uid);
        await user.chmod(ADMIN_CLIENT, 0o570);

        const filedir = await ensure(ADMIN_CLIENT, `${user.path}/files`, "d");
        await filedir.chown(ADMIN_CLIENT, user.attributes.uid);
        await filedir.chmod(ADMIN_CLIENT, 0o770);
    }
};
