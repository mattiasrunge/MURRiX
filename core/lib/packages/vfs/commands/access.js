"use strict";

const chalk = require("chalk");
const { api } = require("../../../api");
const { getModeString } = require("../../../lib/mode");

module.exports = async (client, term,
    // Print node access
    opts,
    abspath = "" // AbsolutePath
) => {
    const node = await api.resolve(client, abspath, { nofollow: true });
    const uname = await api.uid(client, node.properties.uid);
    const gname = await api.gid(client, node.properties.gid);
    const umode = getModeString(node.properties.mode, { owner: true });
    const gmode = getModeString(node.properties.mode, { group: true });
    const omode = getModeString(node.properties.mode, { other: true });
    const data = [];

    data.push([
        chalk.bold`Owner:`,
        " ",
        umode,
        uname
    ]);
    data.push([
        chalk.bold`Group:`,
        " ",
        gmode,
        gname
    ]);
    data.push([
        chalk.bold`Other:`,
        " ",
        omode,
        ""
    ]);

    if (node.properties.acl) {
        for (const ac of node.properties.acl) {
            if (ac.uid) {
                data.push([
                    chalk.bold`User:`,
                    "ACL",
                    getModeString(ac.mode, { acl: true }),
                    await api.uid(client, ac.uid)
                ]);
            }

            if (ac.gid) {
                data.push([
                    chalk.bold`Group:`,
                    "ACL",
                    getModeString(ac.mode, { acl: true }),
                    await api.gid(client, ac.gid)
                ]);
            }
        }
    }

    term.writeTable(data);
};
