"use strict";

const GID_ADMIN = 1000;
const GID_GUEST = 1001;
const GID_USERS = 1002;
const UID_ADMIN = 1000;
const UID_GUEST = 1001;

const ADMIN_SESSION = {
    username: "admin",
    almighty: true,
    admin: new Date(),
    uid: UID_ADMIN,
    gid: GID_ADMIN,
    gids: [ GID_ADMIN, GID_USERS ],
    umask: 0o770
};

const isAdmin = (session) => {
    return session.almighty || session.admin || session.username === "admin";
};

const isGuest = (session) => {
    return session.username === "guest"; // TODO: Check UID?
};

module.exports = {
    GID_ADMIN,
    GID_GUEST,
    GID_USERS,
    UID_ADMIN,
    UID_GUEST,
    ADMIN_SESSION,
    isAdmin,
    isGuest
};
