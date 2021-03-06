"use strict";

const Client = require("./Client");
const sha1 = require("sha1");
const bcrypt = require("bcryptjs");

const USERNAME_ADMIN = "admin";
const USERNAME_GUEST = "guest";
const GID_ADMIN = 1000;
const GID_GUEST = 1001;
const GID_USERS = 1002;
const GID_CUSTODIANS = 1003;
const UID_ADMIN = 1000;
const UID_GUEST = 1001;

const ADMIN_CLIENT = new Client({});

ADMIN_CLIENT.setUser({
    username: USERNAME_ADMIN,
    almighty: true,
    admin: new Date(),
    uid: UID_ADMIN,
    gid: GID_ADMIN,
    gids: [ GID_ADMIN, GID_USERS, GID_CUSTODIANS ],
    umask: 0o770
});

const hashPassword = async (password) => bcrypt.hash(sha1(password), 13);
const matchPassword = async (hash, password) => hash && await bcrypt.compare(sha1(password), hash);

module.exports = {
    GID_ADMIN,
    GID_GUEST,
    GID_USERS,
    GID_CUSTODIANS,
    UID_ADMIN,
    UID_GUEST,
    ADMIN_CLIENT,
    USERNAME_ADMIN,
    USERNAME_GUEST,
    Client,
    hashPassword,
    matchPassword
};
