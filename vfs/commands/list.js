"use strict";

const Node = require("../lib/Node");

// TODO: Add support for limit/skip and sorting

module.exports = async (session, abspath, options = {}) => {
    let list;

    if (abspath instanceof Array) {
        const promises = abspath.map((abspath) => Node.list(session, abspath, options));
        const results = await Promise.all(promises);

        list = results.reduce((acc, val) => acc.concat(val), []);
    } else {
        list = await Node.list(session, abspath, options);
    }

    return Promise.all(list.map((node) => node.serialize(session)));
};
