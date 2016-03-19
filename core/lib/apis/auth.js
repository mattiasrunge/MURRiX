"use strict";

const co = require("bluebird").coroutine;
const sha1 = require("sha1");
const api = require("api.io");
const vfs = require("./vfs");

let params = {};

let auth = api.register("auth", {
    init: co(function*(config) {
        params = config;

        if (!(yield vfs.resolve(auth.getAdminSession(), "/users", true))) {
            yield vfs.create(auth.getAdminSession(), "/users", "d");
        }

        if (!(yield vfs.resolve(auth.getAdminSession(), "/groups", true))) {
            yield vfs.create(auth.getAdminSession(), "/groups", "d");
        }

        if (!(yield vfs.resolve(auth.getAdminSession(), "/users/admin", true))) {
            yield vfs.create(auth.getAdminSession(), "/users/admin", "u", {
                uid: 1000,
                gid: 1000,
                password: sha1("admin"),
                name: "Administrator"
            });
        }

        if (!(yield vfs.resolve(auth.getAdminSession(), "/users/guest", true))) {
            yield vfs.create(auth.getAdminSession(), "/users/guest", "u", {
                uid: 1001,
                gid: 1001,
                password: sha1("guest"),
                name: "Guest"
            });
        }

        if (!(yield vfs.resolve(auth.getAdminSession(), "/groups/admin", true))) {
            yield vfs.create(auth.getAdminSession(), "/groups/admin", "g", {
                gid: 1000,
                name: "Administrators"
            });

            yield auth.link(auth.getAdminSession(), "/users/admin", "/groups/admin");
            yield auth.link(auth.getAdminSession(), "/groups/admin", "/users/admin");
        }

        if (!(yield vfs.resolve(auth.getAdminSession(), "/groups/guest", true))) {
            yield vfs.create(auth.getAdminSession(), "/groups/guest", "g", {
                gid: 1001,
                name: "Guests"
            });

            yield auth.link(auth.getAdminSession(), "/users/guest", "/groups/guest");
            yield auth.link(auth.getAdminSession(), "/groups/guest", "/users/guest");
        }
    }),
    getAdminSession: () => {
        return {
            username: "admin",
            uid: 1000,
            gid: 1000,
            umask: "770"
        };
    },
    session: function*(session) {
        if (!session.username) {
            yield auth.logout(session);
        }

        return session;
    },
    login: function*(session, username, password) {
        let user = yield vfs.resolve(auth.getAdminSession(), "/users/" + username);

        if (!user) {
            throw new Error("No user called " + username + " found");
        }

        if (user.attributes.password !== sha1(password)) {
            throw new Error("Authentication failed");
        }

        let groups = yield vfs.list(auth.getAdminSession(), "/users/" + username);

        session.username = username;
        session.uid = user.attributes.uid;
        session.gid = user.attributes.gid;
        session.gids = groups.map((group) => group.node.attributes.gid);

        return user;
    },
    logout: function*(session) {
        let user = yield vfs.resolve(auth.getAdminSession(), "/users/guest");

        if (!user) {
            throw new Error("No user called guest found");
        }

        let groups = yield vfs.list(auth.getAdminSession(), "/users/guest");

        session.username = "guest";
        session.uid = user.attributes.uid;
        session.gid = user.attributes.gid;
        session.gids = groups.map((group) => group.node.attributes.gid);

        return user;
    },
    passwd: function*(session, username, password) {
        return vfs.setattributes(session, "/users/" + username, {
            password: sha1(password)
        });
    },
    id: function*(session, username) {
        let user = yield vfs.resolve(auth.getAdminSession(), "/users/" + username);
        let groups = yield vfs.list(auth.getAdminSession(), "/users/" + username);

        return {
            uid: {
                id: user.attributes.uid,
                name: username
            },
            gid: {
                id: user.attributes.gid,
                name: groups.filter((group) => group.node.attributes.gid === user.attributes.gid).map((group) => group.name)[0] || ""
            },
            gids: groups.map((group) => {
                return {
                    id: group.node.attributes.gid,
                    name: group.name
                };
            })
        };
    },
    uname: function*(session, uid) {
        let users = yield vfs.list(auth.getAdminSession(), "/users");

        for (let user of users) {
            if (user.node.attributes.uid === uid) {
                return user.name;
            }
        }

        return false;
    },
    gname: function*(session, gid) {
        let groups = yield vfs.list(auth.getAdminSession(), "/groups");

        for (let group of groups) {
            if (group.node.attributes.gid === gid) {
                return group.name;
            }
        }

        return false;
    },
    uid: function*(session, uname) {
        let user = yield vfs.resolve(auth.getAdminSession(), "/users/" + uname);

        return user.attributes.uid;
    },
    gid: function*(session, gname) {
        let group = yield vfs.resolve(auth.getAdminSession(), "/groups/" + gname);

        return group.attributes.gid;
    },
    allocateuid: function*(/*session*/) {
        let users = yield vfs.list(auth.getAdminSession(), "/users");
        let uid = 0;

        for (let user of users) {
            if (user.node.attributes.uid > uid) {
                uid = user.node.attributes.uid;
            }
        }

        return uid + 1;
    },
    allocategid: function*(/*session*/) {
        let groups = yield vfs.list(auth.getAdminSession(), "/groups");
        let gid = 0;

        for (let group of groups) {
            if (group.node.attributes.gid > gid) {
                gid = group.node.attributes.gid;
            }
        }

        return gid + 1;
    },
    mkgroup: function*(session, name, fullname) {
        return yield vfs.create(session, "/groups/" + name, "g", {
            gid: yield auth.allocategid(),
            name: fullname
        });
    },
    mkuser: function*(session, username, fullname) {
        let group = yield vfs.create(session, "/groups/" + username, "g", {
            gid: yield auth.allocategid(),
            name: fullname
        });

        let user = yield vfs.create(session, "/users/" + username, "u", {
            uid: yield auth.allocateuid(),
            gid: group.attributes.gid,
            name: fullname
        });

        yield vfs.link(session, "/groups/" + username, "/users/" + username);
        yield vfs.link(session, "/users/" + username, "/groups/" + username);

        return user;
    }
});

module.exports = auth;
