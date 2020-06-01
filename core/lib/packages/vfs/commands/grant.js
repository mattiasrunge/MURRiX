"use strict";

const { MASKS, getMode } = require("../../../lib/mode");
const { api } = require("../../../api");

module.exports = async (client, term,
    // Grant access (ACL) to user or group for node
    //
    // Who:
    // <user>
    // :<group>
    opts, // r Recursive grant
    mode, // ModeString
    who, // UserOrGroup
    abspath // AbsolutePath
) => {
    const ac = {
        mode: getMode(mode, MASKS.ACL)
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
