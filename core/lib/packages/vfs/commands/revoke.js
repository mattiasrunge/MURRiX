"use strict";

const { api } = require("../../../api");

module.exports = async (client, term,
    // Revoke access (ACL) to user or group for node
    //
    // Who:
    // <user>
    // :<group>
    opts, // r Recursive grant
    who, // UserOrGroup
    abspath // AbsolutePath
) => {
    const ac = {
        mode: 0
    };

    if (who.uid) {
        ac.uid = who.uid;
    } else if (who.gid) {
        ac.gid = who.gid;
    }

    await api.setfacl(client, abspath, ac, {
        recursive: opts.r
    });
};
