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

module.exports = {
    MASKS,
    getMode,
    checkMode
};
