"use strict";

const Node = require("../lib/Node");
const media = require("./media");

module.exports = async (session, abspath, options = {}) => {
    let list;

    if (abspath instanceof Array) {
        const promises = abspath.map((abspath) => Node.list(session, abspath, options));
        const results = await Promise.all(promises);

        list = results.reduce((acc, val) => acc.concat(val), []);
    } else {
        list = await Node.list(session, abspath, options);
    }

    const serialized = await Promise.all(list.map((node) => node.serialize(session)));

    if (options.media) {
        return Promise.all(serialized.map(async (node) => ({
            ...node,
            url: await media(session, node.path, options.media)
        })));
    }

    return serialized;
};
