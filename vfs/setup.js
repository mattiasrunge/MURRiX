"use strict";

const log = require("../lib/log")(module);
const sha1 = require("sha1");
const Root = require("./types/Root");
const Node = require("./lib/Node");
const { GID_ADMIN, GID_GUEST, GID_USERS, GID_CUSTODIANS, UID_ADMIN, UID_GUEST } = require("./lib/auth");

const setup = async (session, api) => {
    if (!(await api.exists(session, "/"))) {
        log.info("No root node found, creating...");
        await Root.create(session);
    }

    // Create folders
    await api.ensure(session, "/users", "d");
    await api.ensure(session, "/groups", "d");

    // Create admin group
    if (!(await api.exists(session, "/groups/admin"))) {
        log.info("No admin group found, creating...");
        await api.mkgroup(session, "admin", "Administrators");

        const group = await Node.resolve(session, "/groups/admin");
        await group.update(session, { gid: GID_ADMIN });
    }

    // Create guest group
    if (!(await api.exists(session, "/groups/guest"))) {
        log.info("No guest group found, creating...");
        await api.mkgroup(session, "guest", "Guest");

        const group = await Node.resolve(session, "/groups/guest");
        await group.update(session, { gid: GID_GUEST });
    }

    // Create users group
    if (!(await api.exists(session, "/groups/users"))) {
        log.info("No users group found, creating...");
        await api.mkgroup(session, "users", "Users");

        const group = await Node.resolve(session, "/groups/users");
        await group.update(session, { gid: GID_USERS });
    }

    // Create custodian group
    if (!(await api.exists(session, "/groups/custodians"))) {
        log.info("No custodians group found, creating...");
        await api.mkgroup(session, "custodians", "Content Custodians");

        const group = await Node.resolve(session, "/groups/custodians");
        await group.update(session, { gid: GID_CUSTODIANS });
    }

    // Create admin user
    if (!(await api.exists(session, "/users/admin"))) {
        log.info("No admin user found, creating...");
        await api.mkuser(session, "admin", "Administrator");

        const user = await Node.resolve(session, "/users/admin");
        await user.update(session, {
            uid: UID_ADMIN,
            gid: GID_ADMIN,
            password: sha1("admin")
        });
        await api.usermod(session, "admin", "admin");
    }

    // Create guest user
    if (!(await api.exists(session, "/users/guest"))) {
        log.info("No guest user found, creating...");
        await api.mkuser(session, "guest", "Guest");

        const user = await Node.resolve(session, "/users/guest");
        await user.update(session, {
            uid: UID_GUEST,
            password: sha1("admin")
        });
    }
};

module.exports = setup;
