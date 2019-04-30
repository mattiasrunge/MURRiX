"use strict";

const Node = require("../../../core/Node");
const { ADMIN_SESSION } = require("../../../core/auth");

module.exports = async (session, username, resetId, password) => {
    const user = await Node.resolve(ADMIN_SESSION, `/users/${username}`);
    await user.resetPassword(ADMIN_SESSION, resetId, password);
};
