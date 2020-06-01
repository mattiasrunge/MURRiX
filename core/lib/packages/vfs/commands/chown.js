"use strict";

const { api } = require("../../../api");

module.exports = async (client, term,
    // Change owner and group for node
    //
    // Values:
    //  <owner>:<group> or <uid>:<gid>
    //  <owner>         or <uid>
    //  :<group>        or :<gid>
    opts, // r Recursive chown
    value, // UserGroup
    abspath // AbsolutePath
) => {
    await api.chown(client, abspath, value.uid, value.gid, {
        recursive: opts.r
    });
};
