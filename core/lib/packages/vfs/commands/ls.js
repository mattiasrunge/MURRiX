"use strict";

const path = require("path");
const moment = require("moment");
const { getModeString } = require("../../../lib/mode");
const { api } = require("../../../api");

module.exports = async (client, term,
    // List node children
    opts, // l List with details
    abspath = "" // AbsolutePath
) => {
    const nodes = await api.list(client, abspath, {
        noerror: true,
        nofollow: true
    });

    if (!opts.l) {
        return term.writeln(nodes.map(({ name }) => name).join("  "));
    }

    if (!abspath.includes("*")) {
        const node = await api.resolve(client, abspath);
        const parent = await api.resolve(client, path.dirname(abspath));

        nodes.unshift({
            ...node,
            name: "."
        }, {
            ...parent,
            name: ".."
        });
    }

    const ucache = {};
    const gcache = {};
    const data = [];

    for (const node of nodes) {
        const uid = node.properties.uid;
        const gid = node.properties.gid;

        const user = ucache[uid] = ucache[uid] ?? await api.uid(client, uid);
        const group = gcache[gid] = gcache[gid] ?? await api.gid(client, gid);
        let name = node.name;

        if (node.properties.type === "s") {
            name += ` -> ${node.attributes.path}`;
        }

        const acl = node.properties.acl && node.properties.acl.length > 0 ? "+" : "";
        const mode = getModeString(node.properties.mode);

        data.push([
            node.properties.type + mode + acl, // mode
            node.properties.count, // count
            user, // uid
            group, // gid
            Object.keys(node.properties.children).length, // children
            moment(node.properties.mtime).format(), // mtime
            name // name
        ]);
    }

    term.writeTable(data);
};
