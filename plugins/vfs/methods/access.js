"use strict";

const { checkMode, MASKS } = require("../lib/accesslib");

const access = async (session, node, modestr) => {
    if (!session.username) {
        throw new Error("Corrupt session, please reinitialize");
    }

    if (session.almighty || session.username === "admin" || session.admin) {
        return true;
    }

    if (!node || !node._id) {
        throw new Error(`Node not valid, node was ${JSON.stringify(node, null, 2)}`);
    }

    const mode = node.properties.mode;

    if (node.properties.uid === session.uid && checkMode(mode, modestr, MASKS.OWNER)) {
        return true;
    } else if (session.gids.includes(node.properties.gid) && checkMode(mode, modestr, MASKS.GROUP)) {
        return true;
    } else if (checkMode(mode, modestr, MASKS.OTHER)) {
        return true;
    }

    if (node.properties.acl && node.properties.acl.length > 0) {
        for (const ac of node.properties.acl) {
            const validAcl = (ac.uid && ac.uid === session.uid) || (ac.gid && session.gids.includes(ac.gid));

            if (validAcl && checkMode(mode, modestr, MASKS.ACL)) {
                return true;
            }
        }
    }

    return false;
};

module.exports = access;
