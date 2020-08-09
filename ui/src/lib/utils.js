
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

const utils = {
    MASKS,
    sortNodeList: (list) => {
        list.sort((a, b) => {
            if (!a.attributes.time) {
                return a.attributes.name.localeCompare(b.attributes.name);
            } else if (!b.attributes.time) {
                return b.attributes.name.localeCompare(a.attributes.name);
            }

            return a.attributes.time.timestamp - b.attributes.time.timestamp;
        });

        return list;
    },
    classNames(...args) {
        return args.filter(Boolean).join(" ");
    },
    basename: (path) => path.replace(/.*\//, ""),
    dirname: (path) => path.match(/(.*)\//)[1],
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

        const modeStringType = (MASK) => {
            let str = "";

            str += mode & MASK.READ ? "r" : "-";
            str += mode & MASK.WRITE ? "w" : "-";
            str += mode & MASK.EXEC ? "x" : "-";

            return str;
        };

        if (acl) {
            modeStr += modeStringType(MASKS.ACL);
        }

        if (owner) {
            modeStr += modeStringType(MASKS.OWNER);
        }

        if (group) {
            modeStr += modeStringType(MASKS.GROUP);
        }

        if (other) {
            modeStr += modeStringType(MASKS.OTHER);
        }

        return modeStr;
    },
    getValue: (obj, key) => {
        if (key.includes(".")) {
            const [ , key1, rest ] = key.split(/(.*?)\.(.*)/);

            return utils.getValue(obj[key1], rest);
        }

        return obj[key];
    }
};

export default utils;
