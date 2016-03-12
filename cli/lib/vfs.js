"use strict";

const client = require("./client");

module.exports = {
    resolve: (abspath) => {
        return client.call("resolve", {
            abspath: abspath
        });
    },
    access: (abspath, modestr) => {
        return client.call("access", {
            abspath: abspath,
            modestr: modestr
        });
    },
    chmod: (abspath, mode) => {
        return client.call("chmod", {
            abspath: abspath,
            mode: mode
        });
    },
    chown: (abspath, userstring) => {
        let group = false;
        let username = userstring;

        if (userstring.indexOf(":") !== -1) {
            let parts = userstring.split(":");
            username = parts[0];
            group = parts[1];
        }

        return client.call("chown", {
            abspath: abspath,
            username: username,
            group: group
        });
    },
    copy: (srcpath, destpath) => {
        return client.call("copy", {
            srcpath: srcpath,
            destpath: destpath
        });
    },
    move: (srcpath, destpath) => {
        return client.call("move", {
            srcpath: srcpath,
            destpath: destpath
        });
    },
    link: (srcpath, destpath) => {
        return client.call("link", {
            srcpath: srcpath,
            destpath: destpath
        });
    },
    unlink: (abspath) => {
        return client.call("unlink", {
            abspath: abspath
        });
    },
    create: (abspath, type, attributes) => {
        return client.call("create", {
            abspath: abspath,
            type: type,
            attributes: attributes || {}
        });
    },
    setAttributes: (abspath, attributes) => {
         return client.call("setattributes", {
             abspath: abspath,
             attributes: attributes
         });
    },
    list: (abspath, all) => {
        return client.call("list", {
            abspath: abspath,
            all: all
        });
    },
    find: (abspath, search) => {
        return client.call("find", {
            abspath: abspath,
            search: search
        });
    },

    allocateUploadId: () => {
        return client.call("allocateuploadid");
    },

    id: (username) => {
        return client.call("id", {
            username: username
        });
    },
    login: (username, password) => {
        return client.call("login", { username: username, password: password });
    },
    logout: () => {
        return client.call("logout");
    },
    passwd: (username, password) => {
        return client.call("passwd", { username: username, password: password });
    },
    uname: (uid) => {
        return client.call("uname", { uid: uid });
    },
    gname: (gid) => {
        return client.call("gname", { gid: gid });
    },
    mkgroup: (name, fullname) => {
        return client.call("create", {
            abspath: "/groups/" + name,
            type: "g",
            attributes: {
                name: fullname
            }
        });
    },
    mkuser: (username, fullname) => {
        let p = client.call("create", {
            abspath: "/groups/" + username,
            type: "g",
            attributes: {
                name: fullname
            }
        });

        p = p.then((group) => {
            return client.call("create", {
                abspath: "/users/" + username,
                type: "u",
                attributes: {
                    gid: group.attributes.gid,
                    name: fullname
                }
            });
        });

        p = p.then(() => {
            return client.call("link", {
                srcpath: "/groups/" + username,
                destpath: "/users/" + username
            });
        });

        p = p.then(() => {
            return client.call("link", {
                srcpath: "/users/" + username,
                destpath: "/groups/" + username
            });
        });

        return p;
    }
};

















