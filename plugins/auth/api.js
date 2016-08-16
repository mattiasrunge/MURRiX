"use strict";

const co = require("bluebird").coroutine;
const promisifyAll = require("bluebird").promisifyAll;
const sha1 = require("sha1");
const uuid = require("node-uuid");
const email = require("emailjs");
const api = require("api.io");
const vfs = require("../vfs/api");

let params = {};

let auth = api.register("auth", {
    deps: [ "vfs" ],
    init: co(function*(config) {
        params = config;

        // Create folders
        if (!(yield vfs.resolve(auth.getAdminSession(), "/users", { noerror: true }))) {
            yield vfs.create(auth.getAdminSession(), "/users", "d");
        }

        if (!(yield vfs.resolve(auth.getAdminSession(), "/groups", { noerror: true }))) {
            yield vfs.create(auth.getAdminSession(), "/groups", "d");
        }

        // Create admin group
        if (!(yield vfs.resolve(auth.getAdminSession(), "/groups/admin", { noerror: true }))) {
            yield auth.mkgroup(auth.getAdminSession(), "admin", "Administrators", "");
            yield vfs.setattributes(auth.getAdminSession(), "/groups/admin", {
                gid: 1000
            });
        }

        // Create guest group
        if (!(yield vfs.resolve(auth.getAdminSession(), "/groups/guest", { noerror: true }))) {
            yield auth.mkgroup(auth.getAdminSession(), "guest", "Guest", "");
            yield vfs.setattributes(auth.getAdminSession(), "/groups/guest", {
                gid: 1001
            });
        }

        // Create users group
        if (!(yield vfs.resolve(auth.getAdminSession(), "/groups/users", { noerror: true }))) {
            yield auth.mkgroup(auth.getAdminSession(), "users", "Users", "");
            yield vfs.setattributes(auth.getAdminSession(), "/groups/users", {
                gid: 1002
            });
        }

        // Create admin user
        if (!(yield vfs.resolve(auth.getAdminSession(), "/users/admin", { noerror: true }))) {
            yield auth.mkuser(auth.getAdminSession(), "admin", "Administrator");
            yield vfs.setattributes(auth.getAdminSession(), "/users/admin", {
                uid: 1000,
                gid: 1000,
                password: sha1("admin")
            });
            yield auth.connect(auth.getAdminSession(), "admin", "admin");
        }

        // Create guest user
        if (!(yield vfs.resolve(auth.getAdminSession(), "/users/guest", { noerror: true }))) {
            yield auth.mkuser(auth.getAdminSession(), "guest", "Guest");
            yield vfs.setattributes(auth.getAdminSession(), "/users/guest", {
                uid: 1001,
                gid: 1001,
                password: sha1("guest")
            });
            yield auth.connect(auth.getAdminSession(), "guest", "guest");
        }
    }),
    getAdminSession: () => {
        return {
            username: "admin",
            uid: 1000,
            gid: 1000,
            gids: [ 1000, 1002 ],
            umask: "770"
        };
    },
    session: function*(session) {
        if (!session.username) {
            yield auth.logout(session);
        }

        return session;
    },
    whoami: function*(session) {
        if (!session.username) {
            return { username: "guest", user: yield auth.logout(session) };
        }

        let personPath = false;
        let user = yield vfs.resolve(auth.getAdminSession(), "/users/" + session.username);
        let person = yield vfs.resolve(auth.getAdminSession(), "/users/" + session.username + "/person", { noerror: true, nofollow: true });
        let stars = yield auth.getStars(session);

        if (person) {
            personPath = person.attributes.path;
        }

        return { username: session.username, user: user, personPath: personPath, stars: stars };
    },
    getStars: function*(session) {
        if (session.username === "guest") {
            return [];
        }

        if (yield vfs.resolve(auth.getAdminSession(), "/users/" + session.username + "/stars", { noerror: true, nofollow: true })) {
            let list = yield vfs.list(auth.getAdminSession(), "/users/" + session.username + "/stars");

            return list.map((item) => {
                delete item.node;
                return item;
            });
        }

        return [];
    },
    toggleStar: function*(session, abspath) {
        if (session.username === "guest") {
            throw new Error("Not allowed");
        }

        yield vfs.ensure(auth.getAdminSession(), "/users/" + session.username + "/stars", "d");

        let stars = yield auth.getStars(session);
        let star = stars.filter((star) => star.path === abspath)[0];

        if (star) {
            yield vfs.unlink(auth.getAdminSession(), "/users/" + session.username + "/stars/" + star.name);

            let index = stars.indexOf(star);

            if (index !== -1) {
                stars.splice(index, 1);
            }
        } else {
            yield vfs.symlink(auth.getAdminSession(), abspath, "/users/" + session.username + "/stars");
            stars = yield auth.getStars(session);
        }

        return { stars: stars, created: !star };
    },
    groups: function*(session, options) {
        if (session.username === "guest") {
            throw new Error("Not allowed");
        }

        return yield vfs.list(auth.getAdminSession(), "/groups", options);
    },
    groupList: function*(session, username) {
        if (username !== session.username && session.username !== "admin") {
            throw new Error("Not allowed");
        }

        return yield vfs.list(auth.getAdminSession(), "/users/" + username + "/groups");
    },
    userList: function*(session, groupname) {
        if (session.username === "guest") {
            throw new Error("Not allowed");
        }

        return yield vfs.list(auth.getAdminSession(), "/groups/" + groupname + "/users");
    },
    login: function*(session, username, password) {
        let user = yield vfs.resolve(auth.getAdminSession(), "/users/" + username);

        if (!user) {
            throw new Error("No user called " + username + " found");
        }

        if (user.attributes.password !== sha1(password)) {
            throw new Error("Authentication failed");
        }

        let groups = yield vfs.list(auth.getAdminSession(), "/users/" + username + "/groups");

        session.username = username;
        session.uid = user.attributes.uid;
        session.gid = user.attributes.gid;
        session.gids = groups.map((group) => group.node.attributes.gid);

        user.attributes.loginTime = new Date();

        yield vfs.setattributes(auth.getAdminSession(), "/users/" + username, {
            loginTime: user.attributes.loginTime
        });

        return user;
    },
    logout: function*(session) {
        let user = yield vfs.resolve(auth.getAdminSession(), "/users/guest");

        if (!user) {
            throw new Error("No user called guest found");
        }

        let groups = yield vfs.list(auth.getAdminSession(), "/users/guest/groups");

        session.username = "guest";
        session.uid = user.attributes.uid;
        session.gid = user.attributes.gid;
        session.gids = groups.map((group) => group.node.attributes.gid);

        return user;
    },
    requestReset: function*(session, username, baseUrl) {
        let user = yield vfs.resolve(auth.getAdminSession(), "/users/" + username);
        let text = "";
        let server = promisifyAll(email.server.connect(params.email));
        let resetId = uuid.v4();
        let url = baseUrl + "#page=reset&email=" + username + "&id=" + resetId;

        yield vfs.setattributes(auth.getAdminSession(), "/users/" + username, {
            resetId: resetId
        });

        text += "A password reset for the account " + username + " has been requested.\n";
        text += "Please follow this link to reset the password: ";

        yield server.sendAsync({
            text: text + url,
            from: "no-reply <" + params.email.user + ">",
            to: user.attributes.name + " <" + username + ">",
            subject: "Password reset",
            attachment: [
                { data: text.replace("\n", "<br>") + "<a href=\"" + url + "\">" + url + "</a>", alternative: true }
            ]
        });
    },
    passwordReset: function*(session, username, resetId, password) {
        let user = yield vfs.resolve(auth.getAdminSession(), "/users/" + username);

        if (user.attributes.resetId !== resetId) {
            throw new Error("Invalid reset id");
        }

        return vfs.setattributes(auth.getAdminSession(), "/users/" + username, {
            resetId: null,
            password: sha1(password)
        });
    },
    saveProfile: function*(session, username, attributes, personPath) {
        if (username !== session.username && session.username !== "admin") {
            throw new Error("Not allowed");
        }

        yield vfs.setattributes(auth.getAdminSession(), "/users/" + username, attributes);

        let person = yield vfs.resolve(auth.getAdminSession(), "/users/" + username + "/person", { noerror: true, nofollow: true });

        if (person && person.attributes.path !== personPath) {
            yield vfs.unlink(auth.getAdminSession(), "/users/" + username + "/person");
        }

        if (personPath && (!person || person.attributes.path !== personPath)) {
            yield vfs.symlink(auth.getAdminSession(), personPath, "/users/" + username + "/person");
        }
    },
    changeUsername: function*(session, oldusername, newusername) {
        if (oldusername === "admin" || oldusername === "guest") {
            throw new Error("System account can not change name");
        }

        if (oldusername !== session.username && session.username !== "admin") {
            throw new Error("Not allowed");
        }

        yield vfs.move(auth.getAdminSession(), "/users/" + oldusername, "/users/" + newusername);
        // TODO: symlinks to groups needs to be updated if username changed
    },
    passwd: function*(session, username, password) {
        if (username !== session.username && session.username !== "admin") {
            throw new Error("Not allowed");
        }

        return vfs.setattributes(auth.getAdminSession(), "/users/" + username, {
            password: sha1(password)
        });
    },
    id: function*(session, username) {
        let user = yield vfs.resolve(auth.getAdminSession(), "/users/" + username);
        let groups = yield vfs.list(auth.getAdminSession(), "/users/" + username + "/groups");

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
    picture: function*(session, uid) {
        let users = yield vfs.list(auth.getAdminSession(), "/users");

        for (let user of users) {
            if (user.node.attributes.uid === uid) {
                let person = yield vfs.resolve(auth.getAdminSession(), "/users/" + user.name + "/person/profilePicture", { noerror: true });

                if (person) {
                    return person._id;
                }
            }
        }

        return false;
    },
    name: function*(session, uid) {
        let users = yield vfs.list(auth.getAdminSession(), "/users");

        for (let user of users) {
            if (user.node.attributes.uid === uid) {
                return user.node.attributes.name;
            }
        }

        return false;
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
    gnameNice: function*(session, gid) {
        let groups = yield vfs.list(auth.getAdminSession(), "/groups");

        for (let group of groups) {
            if (group.node.attributes.gid === gid) {
                return group.node.attributes.name;
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
    mkgroup: function*(session, name, fullname, description) {
        let group = yield vfs.create(session, "/groups/" + name, "g", {
            gid: yield auth.allocategid(),
            name: fullname,
            description: description || ""
        });

        yield vfs.create(session, "/groups/" + name + "/users", "d");

        return group;
    },
    mkuser: function*(session, username, fullname) {
        let user = yield vfs.create(session, "/users/" + username, "u", {
            uid: yield auth.allocateuid(),
            gid: username === "guest" ? 1001 : 1002,
            name: fullname
        });

        yield vfs.create(session, "/users/" + username + "/groups", "d");

        if (username !== "guest") {
            yield auth.connect(session, username, "users");
        }

        return user;
    },
    connect: function*(session, username, groupname) {
        yield vfs.symlink(session, "/groups/" + groupname, "/users/" + username + "/groups");
        yield vfs.symlink(session, "/users/" + username, "/groups/" + groupname + "/users");
    }
});

module.exports = auth;
