"use strict";

const path = require("path");
const assert = require("assert");
const moment = require("moment");
const access = require("../../vfs/commands/access");
const ensure = require("../../vfs/commands/ensure");
const create = require("../../vfs/commands/create");
const { ADMIN_CLIENT } = require("../../../core/auth");

module.exports = async (client, abspath, text) => {
    assert(await access(client, abspath, "r"), "Permission denied");

    const commentsPath = path.join(abspath, "comments");

    await ensure(ADMIN_CLIENT, commentsPath, "d");

    const newClient = client.clone({ almighty: true });

    return create(newClient, commentsPath, "k", moment().format(), { text });
};
