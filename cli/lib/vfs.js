"use strict";

const path = require("path");
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
    }
};
