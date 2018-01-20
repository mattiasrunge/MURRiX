"use strict";

const log = require("../core/lib/log")(module);


const setup = async (session, api) => {
    // Create folders
    // await api.ensure(session, "/users", "d");

    if (!(await api.exists(session, "/albums"))) {
        log.info("No directory /albums found, creating...");
        await api.mkdir(session, "admin", "Administrators");

        const group = await Node.resolve(session, "/groups/admin");
        await group.update(session, { gid: GID_ADMIN });
    }

};

module.exports = setup;
