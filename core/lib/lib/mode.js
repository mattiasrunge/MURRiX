"use strict";

const MASKS = {
    OWNER: {
        READ: 0o400,
        WRITE: 0o200,
        EXEC: 0o100
    },
    GROUP: {
        READ: 0o040,
        WRITE: 0o020,
        EXEC: 0o010
    },
    OTHER: {
        READ: 0o004,
        WRITE: 0o002,
        EXEC: 0o001
    },
    ACL: {
        READ: 0o004,
        WRITE: 0o002,
        EXEC: 0o001
    }
};

const getMode = (modestr, masks) => {
    let mode = 0;

    mode |= modestr.includes("r") ? masks.READ : 0;
    mode |= modestr.includes("w") ? masks.WRITE : 0;
    mode |= modestr.includes("x") ? masks.EXEC : 0;

    return mode;
};

const checkMode = (mode, modestr, masks) => {
    const modeLevel = getMode(modestr, masks);

    return (mode & modeLevel) > 0;
};

const modeStringType = (mode, MASK) => {
    let str = "";

    str += mode & MASK.READ ? "r" : "-";
    str += mode & MASK.WRITE ? "w" : "-";
    str += mode & MASK.EXEC ? "x" : "-";

    return str;
};

const getModeString = (mode, options) => {
    let modeStr = "";

    if (options?.acl) {
        modeStr += modeStringType(mode, MASKS.ACL);
    }

    if (!options || options?.owner) {
        modeStr += modeStringType(mode, MASKS.OWNER);
    }

    if (!options || options?.group) {
        modeStr += modeStringType(mode, MASKS.GROUP);
    }

    if (!options || options?.other) {
        modeStr += modeStringType(mode, MASKS.OTHER);
    }

    return modeStr;
};

module.exports = {
    MASKS,
    getMode,
    checkMode,
    getModeString
};
