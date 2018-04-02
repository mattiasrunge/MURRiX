"use strict";

const path = require("path");
const moment = require("moment");
const access = require("../../vfs/commands/access");
const ensure = require("../../vfs/commands/ensure");
const create = require("../../vfs/commands/create");
const { ADMIN_SESSION } = require("../../vfs/lib/auth");

module.exports = async (session, abspath, text) => {
    if (!(await access(session, abspath, "r"))) {
        throw new Error("Permission denied");
    }

    const commentsPath = path.join(abspath, "comments");

    await ensure(ADMIN_SESSION, commentsPath, "d");

    session.almighty = true;
    const comment = create(session, commentsPath, "k", moment().format(), { text });
    session.almighty = false;

    return comment;
};
