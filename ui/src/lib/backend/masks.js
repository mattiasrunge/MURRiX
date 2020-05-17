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

export default MASKS;
