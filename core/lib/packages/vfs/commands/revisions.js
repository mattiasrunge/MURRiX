"use strict";

const color = require("../../../lib/color");
const { api } = require("../../../api");

const actionNames = {
    A: "Created",
    M: "Updated"
};

module.exports = async (client, term,
    // Print node revisions
    opts, // l Don't follow links
    abspath = "" // AbsolutePath
) => {
    const revisions = await api.revisions(client, abspath, {
        nofollow: opts.l
    });

    const data = revisions.map((revision) => ([
        revision.date,
        actionNames[revision.action] ?? revision.action,
        revision.revision,
        revision.user
    ]));

    term.writeTable([
        [
            color.bold`Date`,
            color.bold`Action`,
            color.bold`Revision`,
            color.bold`User`
        ],
        ...data
    ]);
};
