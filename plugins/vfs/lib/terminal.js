"use strict";

/* jslint bitwise: true */

const path = require("path");
const co = require("bluebird").coroutine;
const api = require("api.io").client;

module.exports = {
    autocomplete: co(function*(session, input) {
        let cwd = yield session.env("cwd");
        let names = [];

        try {
            if (input === "") {
                let items = yield api.vfs.list(cwd);
                return items.map((item) => item.name + "/");
            }

            let dir = module.exports.normalize(cwd, input);
            let parentDir = dir;
            let match = "";

            if (!dir.endsWith("/")) {
                parentDir = path.dirname(dir);
                match = path.basename(dir);
            }

            let items = yield api.vfs.list(parentDir);
            names = items
            .map((item) => item.name)
            .filter((name) => name.startsWith(match))
            .map((name) => input[0] === "/" ? path.join(parentDir, name) : name)
            .map((dir) => dir[dir.length - 1] === "/" ? dir : dir + "/");

//             console.log("\n" + JSON.stringify(names));
        } catch (e) {
            console.error(e.red);
        }

        return names;
    }),
    normalize: (cwd, dir) => {
        let trailingSlash = dir[dir.length - 1] === "/";
        dir = path.resolve(cwd, dir);

        dir += trailingSlash ? "/" : "";

//         if (dir.startsWith(".") && dir[1] !== ".") {
//             dir = dir.replace(/\./, cwd);
//         } else if (dir.startsWith("..")) {
//             dir = dir.replace(/\.\./, path.dirname(cwd));
//         } else if (!dir.startsWith("/")) {
//             dir = path.join(cwd, dir);
//         }

        return dir.replace(/\/+/g, "/");
    },
    colorName: (name, type) => {
        if (type === "d" || type === "r") {
            return name.bold;
        } else if (type === "u") {
            return name.yellow;
        } else if (type === "g") {
            return name.magenta;
        } else if (type === "f") {
            return name.blue;
        }

        return name;
    },
    modeString: (mode, options) => {
        let modeStr = "";

        let owner = true;
        let group = true;
        let other = true;
        let acl = false;

        if (options) {
            owner = options.owner;
            group = options.group;
            other = options.other;
            acl = options.acl;
        }

        if (acl) {
            modeStr += mode & api.vfs.MASK_ACL_READ ? "r" : "-";
            modeStr += mode & api.vfs.MASK_ACL_WRITE ? "w" : "-";
            modeStr += mode & api.vfs.MASK_ACL_EXEC ? "x" : "-";
        }

        if (owner) {
            modeStr += mode & api.vfs.MASK_OWNER_READ ? "r" : "-";
            modeStr += mode & api.vfs.MASK_OWNER_WRITE ? "w" : "-";
            modeStr += mode & api.vfs.MASK_OWNER_EXEC ? "x" : "-";
        }

        if (group) {
            modeStr += mode & api.vfs.MASK_GROUP_READ ? "r" : "-";
            modeStr += mode & api.vfs.MASK_GROUP_WRITE ? "w" : "-";
            modeStr += mode & api.vfs.MASK_GROUP_EXEC ? "x" : "-";
        }

        if (other) {
            modeStr += mode & api.vfs.MASK_OTHER_READ ? "r" : "-";
            modeStr += mode & api.vfs.MASK_OTHER_WRITE ? "w" : "-";
            modeStr += mode & api.vfs.MASK_OTHER_EXEC ? "x" : "-";
        }

        return modeStr;
    }
};
