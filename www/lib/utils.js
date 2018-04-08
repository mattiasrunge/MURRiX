"use strict";

const api = require("api.io-client");

module.exports = {
    sortNodeList: (list) => {
        list.sort((a, b) => {
            if (!a.attributes.time) {
                return a.attributes.name.localeCompare(b.attributes.name);
            } else if (!b.attributes.time) {
                return b.attributes.name.localeCompare(a.attributes.name);
            }

            return a.attributes.time.timestamp - b.attributes.time.timestamp;
        });
    },
    basename: (path) => {
        return path.replace(/.*\//, "");
    },
    dirname: (path) => {
        return path.match(/(.*)[\/]/)[1];
    },
    modeString: (mode, options) => {
        let modeStr = "";

        let owner = true;
        let group = true;
        let other = true;
        let acl = false;

        if (options) {
            owner = options.owner;
            group = options.group;
            other = options.other;
            acl = options.acl;
        }

        if (acl) {
            modeStr += mode & api.vfs.MASK_ACL_READ ? "r" : "-";
            modeStr += mode & api.vfs.MASK_ACL_WRITE ? "w" : "-";
            modeStr += mode & api.vfs.MASK_ACL_EXEC ? "x" : "-";
        }

        if (owner) {
            modeStr += mode & api.vfs.MASK_OWNER_READ ? "r" : "-";
            modeStr += mode & api.vfs.MASK_OWNER_WRITE ? "w" : "-";
            modeStr += mode & api.vfs.MASK_OWNER_EXEC ? "x" : "-";
        }

        if (group) {
            modeStr += mode & api.vfs.MASK_GROUP_READ ? "r" : "-";
            modeStr += mode & api.vfs.MASK_GROUP_WRITE ? "w" : "-";
            modeStr += mode & api.vfs.MASK_GROUP_EXEC ? "x" : "-";
        }

        if (other) {
            modeStr += mode & api.vfs.MASK_OTHER_READ ? "r" : "-";
            modeStr += mode & api.vfs.MASK_OTHER_WRITE ? "w" : "-";
            modeStr += mode & api.vfs.MASK_OTHER_EXEC ? "x" : "-";
        }

        return modeStr;
    }
};
