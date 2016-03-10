"use strict";

const client = require("./client");
const path = require("path");

module.exports = {
    completer: function*(session, args) {
        if (args[args.length - 1] === "") {
            let items = yield client.call("list", { abspath: session.env("cwd") });
            return items.map((item) => item.name);
        }

        let dir = module.exports.normalize(session.env("cwd"), args[args.length - 1]);
        let parentDir = path.dirname(dir);
        let match = path.basename(dir);
        let items = yield client.call("list", { abspath: parentDir });

        let names = items
        .map((item) => item.name)
        .filter((name) => name.indexOf(match) === 0)
        .map((name) => args[args.length - 1][0] === "/" ? path.join(parentDir, name) : name);

        return names;
    },
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
