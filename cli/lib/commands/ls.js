"use strict";

/* jslint bitwise: true */

const client = require("../client");
const path = require("../path");
const columnify = require("columnify");
const octal = require("octal");
const moment = require("moment");

module.exports = {
    description: "List directory",
    help: "Usage: ls [path]",
    execute: function*(session, params) {
        let dir = params.path || session.env("cwd");
        let items = yield client.call("list", {
            abspath: path.normalize(session.env("cwd"), dir),
            all: true
        });

        let ucache = {};
        let gcache = {};

        for (let item of items) {
            if (!ucache[item.node.properties.uid]) {
                ucache[item.node.properties.uid] = yield client.call("uname", { uid: item.node.properties.uid });
            }

            if (!gcache[item.node.properties.gid]) {
                gcache[item.node.properties.gid] = yield client.call("gname", { gid: item.node.properties.gid });
            }
        }

        let columns = columnify(items.map((item) => {
            let mode = "";
            mode += item.node.properties.mode & octal("400") ? "r" : "-";
            mode += item.node.properties.mode & octal("200") ? "w" : "-";
            mode += item.node.properties.mode & octal("100") ? "x" : "-";
            mode += item.node.properties.mode & octal("040") ? "r" : "-";
            mode += item.node.properties.mode & octal("020") ? "w" : "-";
            mode += item.node.properties.mode & octal("010") ? "x" : "-";
            mode += item.node.properties.mode & octal("004") ? "r" : "-";
            mode += item.node.properties.mode & octal("002") ? "w" : "-";
            mode += item.node.properties.mode & octal("001") ? "x" : "-";

            let name = item.name;

            if (item.node.properties.type === "d" || item.node.properties.type === "r") {
                name = name.bold;
            } else if (item.node.properties.type === "u") {
                name = name.yellow;
            } else if (item.node.properties.type === "g") {
                name = name.magenta;
            }

            return {
                mode: item.node.properties.type + mode,
                count: item.node.properties.count,
                uid: (ucache[item.node.properties.uid] ? ucache[item.node.properties.uid] : item.node.properties.uid.toString()).cyan,
                gid: (gcache[item.node.properties.gid] ? gcache[item.node.properties.gid] : item.node.properties.gid.toString()).cyan,
                children: Object.keys(item.node.properties.children).length,
                mtime: moment(item.node.properties.mtime).format(),
                name: name.bold
            };
        }), {
            showHeaders: false
        });

        session.stdout().write(columns + "\n");
    },
    completer: path.completer
};
