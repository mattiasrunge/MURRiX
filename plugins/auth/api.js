"use strict";

const promisifyAll = require("bluebird").promisifyAll;
const sha1 = require("sha1");
const uuid = require("uuid");
const email = require("emailjs");
const api = require("api.io");
const log = require("../../core/lib/log")(module);

let params = {};

const auth = api.register("auth", {
    deps: [ "vfs" ],
    init: async (config) => {
        params = config;

        // Create folders
        if (!(await api.vfs.resolve(auth.getAdminSession(), "/users", { noerror: true }))) {
            await api.vfs.create(auth.getAdminSession(), "/users", "d");
        }

        if (!(await api.vfs.resolve(auth.getAdminSession(), "/groups", { noerror: true }))) {
            await api.vfs.create(auth.getAdminSession(), "/groups", "d");
        }

        // Create admin group
        if (!(await api.vfs.resolve(auth.getAdminSession(), "/groups/admin", { noerror: true }))) {
            await auth.mkgroup(auth.getAdminSession(), "admin", "Administrators", "");
            await api.vfs.setattributes(auth.getAdminSession(), "/groups/admin", {
                gid: 1000
            });
        }

        // Create guest group
        if (!(await api.vfs.resolve(auth.getAdminSession(), "/groups/guest", { noerror: true }))) {
            await auth.mkgroup(auth.getAdminSession(), "guest", "Guest", "");
            await api.vfs.setattributes(auth.getAdminSession(), "/groups/guest", {
                gid: 1001
            });
        }

        // Create users group
        if (!(await api.vfs.resolve(auth.getAdminSession(), "/groups/users", { noerror: true }))) {
            await auth.mkgroup(auth.getAdminSession(), "users", "Users", "");
            await api.vfs.setattributes(auth.getAdminSession(), "/groups/users", {
                gid: 1002
            });
        }

        // Create admin user
        if (!(await api.vfs.resolve(auth.getAdminSession(), "/users/admin", { noerror: true }))) {
            await auth.mkuser(auth.getAdminSession(), "admin", "Administrator");
            await api.vfs.setattributes(auth.getAdminSession(), "/users/admin", {
                uid: 1000,
                gid: 1000,
                password: sha1("admin")
            });
            await auth.connect(auth.getAdminSession(), "admin", "admin");
        }

        // Create guest user
        if (!(await api.vfs.resolve(auth.getAdminSession(), "/users/guest", { noerror: true }))) {
            await auth.mkuser(auth.getAdminSession(), "guest", "Guest");
            await api.vfs.setattributes(auth.getAdminSession(), "/users/guest", {
                uid: 1001,
                gid: 1001,
                password: sha1("guest")
            });
            await auth.connect(auth.getAdminSession(), "guest", "guest");
        }
    },
    getAdminSession: () => {
        return {
            username: "admin",
            uid: 1000,
            gid: 1000,
            gids: [ 1000, 1002 ],
            umask: 0o770
        };
    },
    session: api.export(async (session) => {
        if (!session.username) {
            await auth.logout(session);
        }

        return session;
    }),
    whoami: api.export(async (session) => {
        if (!session.username) {
            return { username: "guest", user: await auth.logout(session) };
        }

        let personPath = false;
        let user = await api.vfs.resolve(auth.getAdminSession(), "/users/" + session.username);
        let person = await api.vfs.resolve(auth.getAdminSession(), "/users/" + session.username + "/person", { noerror: true, nofollow: true });

        if (person) {
            personPath = person.attributes.path;
        }

        delete user.attributes.password;
        delete user.attributes.resetId;
        // TODO: Invert this

        return { username: session.username, user: user, personPath: personPath };
    }),
    getStars: api.export(async (session) => {
        if (session.username === "guest") {
            return [];
        }

        if (await api.vfs.resolve(auth.getAdminSession(), "/users/" + session.username + "/stars", { noerror: true, nofollow: true })) {
            let list = await api.vfs.list(auth.getAdminSession(), "/users/" + session.username + "/stars");

            return list.map((item) => {
                delete item.node;
                return item;
            });
        }

        return [];
    }),
    toggleStar: api.export(async (session, abspath) => {
        if (session.username === "guest") {
            throw new Error("Not allowed");
        }

        await api.vfs.ensure(auth.getAdminSession(), "/users/" + session.username + "/stars", "d");

        let stars = await auth.getStars(session);
        let star = stars.filter((star) => star.path === abspath)[0];

        if (star) {
            await api.vfs.unlink(auth.getAdminSession(), "/users/" + session.username + "/stars/" + star.name);

            let index = stars.indexOf(star);

            if (index !== -1) {
                stars.splice(index, 1);
            }
        } else {
            await api.vfs.symlink(auth.getAdminSession(), abspath, "/users/" + session.username + "/stars");
            stars = await auth.getStars(session);
        }

        return { stars: stars, created: !star };
    }),
    groups: api.export(async (session, options) => {
        if (session.username === "guest") {
            throw new Error("Not allowed");
        }

        return await api.vfs.list(auth.getAdminSession(), "/groups", options);
    }),
    groupList: api.export(async (session, username) => {
        if (username !== session.username && session.username !== "admin") {
            throw new Error("Not allowed");
        }

        return await api.vfs.list(auth.getAdminSession(), "/users/" + username + "/groups");
    }),
    userList: api.export(async (session, groupname) => {
        if (session.username === "guest") {
            throw new Error("Not allowed");
        }

        return await api.vfs.list(auth.getAdminSession(), "/groups/" + groupname + "/users");
    }),
    login: api.export(async (session, username, password) => {
        let user = await api.vfs.resolve(auth.getAdminSession(), "/users/" + username);

        if (!user) {
            log.error("login: No user called " + username + " found");
            throw new Error("Authentication failed");
        }

        if (!user.attributes.password) {
            log.error("login: User " + username + " is disabled");
            throw new Error("Authentication failed");
        }

        if (user.attributes.password !== sha1(password)) {
            throw new Error("Authentication failed");
        }

        let groups = await api.vfs.list(auth.getAdminSession(), "/users/" + username + "/groups");

        session.username = username;
        session.uid = user.attributes.uid;
        session.gid = user.attributes.gid;
        session.gids = groups.map((group) => group.node.attributes.gid);

        user.attributes.loginTime = new Date();

        await api.vfs.setattributes(auth.getAdminSession(), "/users/" + username, {
            loginTime: user.attributes.loginTime
        });

        return user;
    }),
    logout: api.export(async (session) => {
        let user = await api.vfs.resolve(auth.getAdminSession(), "/users/guest");

        if (!user) {
            throw new Error("No user called guest found");
        }

        let groups = await api.vfs.list(auth.getAdminSession(), "/users/guest/groups");

        session.username = "guest";
        session.uid = user.attributes.uid;
        session.gid = user.attributes.gid;
        session.gids = groups.map((group) => group.node.attributes.gid);

        return user;
    }),
    requestReset: api.export(async (session, username, baseUrl) => {
        let user = await api.vfs.resolve(auth.getAdminSession(), "/users/" + username);
        let text = "";
        let server = promisifyAll(email.server.connect(params.email));
        let resetId = uuid.v4();
        let url = baseUrl + "#page=reset&email=" + username + "&id=" + resetId;

        await api.vfs.setattributes(auth.getAdminSession(), "/users/" + username, {
            resetId: resetId
        });

        text += "A password reset for the account " + username + " has been requested.\n";
        text += "Please follow this link to reset the password: ";

        await server.sendAsync({
            text: text + url,
            from: "no-reply <" + params.email.user + ">",
            to: user.attributes.name + " <" + username + ">",
            subject: "Password reset",
            attachment: [
                { data: text.replace("\n", "<br>") + "<a href=\"" + url + "\">" + url + "</a>", alternative: true }
            ]
        });

        log.info("User " + username + " requested a password reset");
    }),
    passwordReset: api.export(async (session, username, resetId, password) => {
        let user = await api.vfs.resolve(auth.getAdminSession(), "/users/" + username);

        if (user.attributes.resetId !== resetId) {
            throw new Error("Invalid reset id");
        }

        let result = api.vfs.setattributes(auth.getAdminSession(), "/users/" + username, {
            resetId: null,
            password: sha1(password)
        });

        log.info("User " + username + " reset their password");
        return result;
    }),
    saveProfile: api.export(async (session, username, attributes, personPath) => {
        if (username !== session.username && session.username !== "admin") {
            throw new Error("Not allowed");
        }

        await api.vfs.setattributes(auth.getAdminSession(), "/users/" + username, attributes);

        let person = await api.vfs.resolve(auth.getAdminSession(), "/users/" + username + "/person", { noerror: true, nofollow: true });

        if (person && person.attributes.path !== personPath) {
            await api.vfs.unlink(auth.getAdminSession(), "/users/" + username + "/person");
        }

        if (personPath && (!person || person.attributes.path !== personPath)) {
            await api.vfs.symlink(auth.getAdminSession(), personPath, "/users/" + username + "/person");
        }
    }),
    changeUsername: api.export(async (session, oldusername, newusername) => {
        if (oldusername === "admin" || oldusername === "guest") {
            throw new Error("System account can not change name");
        }

        if (oldusername !== session.username && session.username !== "admin" && session.username !== "guest") {
            throw new Error("Not allowed");
        }

        await api.vfs.move(auth.getAdminSession(), "/users/" + oldusername, "/users/" + newusername);
    }),
    passwd: api.export(async (session, username, password) => {
        if (username !== session.username && session.username !== "admin") {
            throw new Error("Not allowed");
        }

        return api.vfs.setattributes(auth.getAdminSession(), "/users/" + username, {
            password: sha1(password)
        });
    }),
    id: api.export(async (session, username) => {
        let user = await api.vfs.resolve(auth.getAdminSession(), "/users/" + username);
        let groups = await api.vfs.list(auth.getAdminSession(), "/users/" + username + "/groups");

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
    }),
    picture: api.export(async (session, uid) => {
        let users = await api.vfs.list(auth.getAdminSession(), "/users");

        for (let user of users) {
            if (user.node.attributes.uid === uid) {
                let person = await api.vfs.resolve(auth.getAdminSession(), "/users/" + user.name + "/person/profilePicture", { noerror: true });

                if (person) {
                    return person._id;
                }
            }
        }

        return false;
    }),
    name: api.export(async (session, uid) => {
        let users = await api.vfs.list(auth.getAdminSession(), "/users");

        for (let user of users) {
            if (user.node.attributes.uid === uid) {
                return user.node.attributes.name;
            }
        }

        return false;
    }),
    uname: api.export(async (session, uid) => {
        let users = await api.vfs.list(auth.getAdminSession(), "/users");

        for (let user of users) {
            if (user.node.attributes.uid === uid) {
                return user.name;
            }
        }

        return false;
    }),
    gname: api.export(async (session, gid) => {
        let groups = await api.vfs.list(auth.getAdminSession(), "/groups");

        for (let group of groups) {
            if (group.node.attributes.gid === gid) {
                return group.name;
            }
        }

        return false;
    }),
    gnameNice: api.export(async (session, gid) => {
        let groups = await api.vfs.list(auth.getAdminSession(), "/groups");

        for (let group of groups) {
            if (group.node.attributes.gid === gid) {
                return group.node.attributes.name;
            }
        }

        return false;
    }),
    uid: api.export(async (session, uname) => {
        let user = await api.vfs.resolve(auth.getAdminSession(), "/users/" + uname);

        return user.attributes.uid;
    }),
    gid: api.export(async (session, gname) => {
        let group = await api.vfs.resolve(auth.getAdminSession(), "/groups/" + gname);

        return group.attributes.gid;
    }),
    allocateuid: api.export(async (/*session*/) => {
        let users = await api.vfs.list(auth.getAdminSession(), "/users");
        let uid = 0;

        for (let user of users) {
            if (user.node.attributes.uid > uid) {
                uid = user.node.attributes.uid;
            }
        }

        return uid + 1;
    }),
    allocategid: api.export(async (/*session*/) => {
        let groups = await api.vfs.list(auth.getAdminSession(), "/groups");
        let gid = 0;

        for (let group of groups) {
            if (group.node.attributes.gid > gid) {
                gid = group.node.attributes.gid;
            }
        }

        return gid + 1;
    }),
    mkgroup: api.export(async (session, name, fullname, description) => {
        let group = await api.vfs.create(session, "/groups/" + name, "g", {
            gid: await auth.allocategid(),
            name: fullname,
            description: description || ""
        });

        await api.vfs.create(session, "/groups/" + name + "/users", "d");

        return group;
    }),
    mkuser: api.export(async (session, username, fullname) => {
        let user = await api.vfs.create(session, "/users/" + username, "u", {
            uid: await auth.allocateuid(),
            gid: username === "guest" ? 1001 : 1002,
            name: fullname
        });

        await api.vfs.create(session, "/users/" + username + "/groups", "d");

        if (username !== "guest") {
            await auth.connect(session, username, "users");
        }

        return user;
    }),
    connect: api.export(async (session, username, groupname) => {
        await api.vfs.symlink(session, "/groups/" + groupname, "/users/" + username + "/groups");
        await api.vfs.symlink(session, "/users/" + username, "/groups/" + groupname + "/users");
    })
});

module.exports = auth;
