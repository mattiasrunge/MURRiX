"use strict";

const assert = require("assert");
const Node = require("../../../lib/Node");
const { getAdminClient } = require("../../../auth");
const { api } = require("../../../api");

module.exports = async (client, abspath) => {
    assert(!client.isGuest(), "Permission denied");

    const starspath = `/users/${client.getUsername()}/stars`;
    await api.ensure(await getAdminClient(), starspath, "d");

    const list = await Node.list(await getAdminClient(), starspath, { nofollow: true });
    const star = list.find((node) => node.attributes.path === abspath);

    if (star) {
        await api.unlink(await getAdminClient(), star.path);
    } else {
        await api.symlink(await getAdminClient(), abspath, starspath);
    }
};
