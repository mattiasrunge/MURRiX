"use strict";

/* jslint bitwise: true */

const path = require("path");
const octal = require("octal");
const co = require("bluebird").coroutine;
const api = require("api.io").client;
const session = require("./session");

module.exports = {
    autocomplete: co(function*(input) {
        let cwd = yield session.env("cwd");
        let names = [];

        try {
            if (input === "") {
                let items = yield api.vfs.list(cwd);
                return items.map((item) => item.name);
            }

            let dir = module.exports.normalize(cwd, input);
            let parentDir = path.dirname(dir);
            let match = path.basename(dir);
            let items = yield api.vfs.list(parentDir);

            names = items
            .map((item) => item.name)
            .filter((name) => name.indexOf(match) === 0)
            .map((name) => input[0] === "/" ? path.join(parentDir, name) : name);
        } catch (e) {
            console.error(e.red);
        }

        return names;
    }),
    normalize: (cwd, dir) => {
        if (dir.indexOf(".") === 0 && dir[1] !== ".") {
            dir = dir.replace(/\./, cwd);
        } else if (dir.indexOf("..") === 0) {
            dir = dir.replace(/\.\./, path.dirname(cwd));
        } else if (dir.indexOf("/") !== 0) {
            dir = path.join(cwd, dir);
        }

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
    modeString: (mode) => {
        let modeStr = "";

        modeStr += mode & octal("400") ? "r" : "-";
        modeStr += mode & octal("200") ? "w" : "-";
        modeStr += mode & octal("100") ? "x" : "-";
        modeStr += mode & octal("040") ? "r" : "-";
        modeStr += mode & octal("020") ? "w" : "-";
        modeStr += mode & octal("010") ? "x" : "-";
        modeStr += mode & octal("004") ? "r" : "-";
        modeStr += mode & octal("002") ? "w" : "-";
        modeStr += mode & octal("001") ? "x" : "-";

        return modeStr;
    }
};
