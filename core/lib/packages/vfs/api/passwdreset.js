"use strict";

const Node = require("../../../lib/Node");
const { ADMIN_CLIENT } = require("../../../auth");

module.exports = async (client, username, resetId, password) => {
    const user = await Node.resolve(ADMIN_CLIENT, `/users/${username}`);
    await user.resetPassword(ADMIN_CLIENT, resetId, password);
};
