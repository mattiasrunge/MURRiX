"use strict";

const Node = require("../lib/Node");
const { ADMIN_SESSION } = require("../lib/auth");

module.exports = async (session, username, resetId, password) => {
    const user = await Node.resolve(ADMIN_SESSION, `/users/${username}`);
    await user.resetPassword(ADMIN_SESSION, resetId, password);
};
