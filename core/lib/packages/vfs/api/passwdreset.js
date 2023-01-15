"use strict";

const Node = require("../../../lib/Node");
const { getAdminClient } = require("../../../auth");

module.exports = async (client, username, resetId, password) => {
    const user = await Node.resolve(await getAdminClient(), `/users/${username}`);
    await user.resetPassword(await getAdminClient(), resetId, password);
};
