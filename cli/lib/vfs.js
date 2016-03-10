"use strict";

/* jslint bitwise: true */

const path = require("path");
const octal = require("octal");
const co = require("bluebird").coroutine;
const client = require("./client");
const session = require("./session");

module.exports = {
    autocomplete: co(function*(input) {
        let names = [];

        try {
            if (input === "") {
                let items = yield client.call("list", { abspath: yield session.env("cwd") });
                return items.map((item) => item.name);
            }

            let dir = module.exports.normalize(yield session.env("cwd"), input);
            let parentDir = path.dirname(dir);
            let match = path.basename(dir);
            let items = yield client.call("list", { abspath: parentDir });

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
