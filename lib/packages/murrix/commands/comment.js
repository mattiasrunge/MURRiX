"use strict";

const path = require("path");
const assert = require("assert");
const moment = require("moment");
const access = require("../../vfs/commands/access");
const ensure = require("../../vfs/commands/ensure");
const create = require("../../vfs/commands/create");
const { ADMIN_SESSION } = require("../../../core/auth");

module.exports = async (session, abspath, text) => {
    assert(await access(session, abspath, "r"), "Permission denied");

    const commentsPath = path.join(abspath, "comments");

    await ensure(ADMIN_SESSION, commentsPath, "d");

    session.almighty = true;
    const comment = create(session, commentsPath, "k", moment().format(), { text });
    session.almighty = false;

    return comment;
};
