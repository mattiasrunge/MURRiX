"use strict";

const sha1 = require("sha1");
const log = require("../../lib/log")(module);
const Root = require("./types/Root");
const Node = require("../../core/Node");
const { api } = require("../../api");
const { GID_ADMIN, GID_GUEST, GID_USERS, GID_CUSTODIANS, UID_ADMIN, UID_GUEST, USERNAME_ADMIN, USERNAME_GUEST } = require("../../lib/auth");

const setup = async (client) => {
    if (!(await api.exists(client, "/"))) {
        log.info("No root node found, creating...");
        await Root.create(client);
    }

    // Create folders
    await api.ensure(client, "/users", "d");
    await api.chmod(client, "/users", 0o771);
    await api.ensure(client, "/groups", "d");
    await api.ensure(client, "/lost+found", "d");

    // Create admin group
    if (!(await api.exists(client, "/groups/admin"))) {
        log.info("No admin group found, creating...");
        await api.mkgroup(client, "admin", "Administrators");

        const group = await Node.resolve(client, "/groups/admin");
        await group.update(client, { gid: GID_ADMIN });
    }

    // Create guest group
    if (!(await api.exists(client, "/groups/guest"))) {
        log.info("No guest group found, creating...");
        await api.mkgroup(client, "guest", "Guest");

        const group = await Node.resolve(client, "/groups/guest");
        await group.update(client, { gid: GID_GUEST });
    }

    // Create users group
    if (!(await api.exists(client, "/groups/users"))) {
        log.info("No users group found, creating...");
        await api.mkgroup(client, "users", "Users");

        const group = await Node.resolve(client, "/groups/users");
        await group.update(client, { gid: GID_USERS });
    }

    // Create custodian group
    if (!(await api.exists(client, "/groups/custodians"))) {
        log.info("No custodians group found, creating...");
        await api.mkgroup(client, "custodians", "Content Custodians");

        const group = await Node.resolve(client, "/groups/custodians");
        await group.update(client, { gid: GID_CUSTODIANS });
    }

    // Create admin user
    if (!(await api.exists(client, `/users/${USERNAME_ADMIN}`))) {
        log.info("No admin user found, creating...");
        await api.mkuser(client, USERNAME_ADMIN, "Administrator");

        const user = await Node.resolve(client, `/users/${USERNAME_ADMIN}`);
        await user.update(client, {
            uid: UID_ADMIN,
            gid: GID_ADMIN,
            password: sha1(USERNAME_ADMIN)
        });
        await api.groupjoin(client, "admin", USERNAME_ADMIN);
    }

    // Create guest user
    if (!(await api.exists(client, `/users/${USERNAME_GUEST}`))) {
        log.info("No guest user found, creating...");
        await api.mkuser(client, USERNAME_GUEST, "Guest");

        const user = await Node.resolve(client, `/users/${USERNAME_GUEST}`);
        await user.update(client, {
            uid: UID_GUEST
        });
    }
};

setup.PRIORITY = 1;

module.exports = setup;
