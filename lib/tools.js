"use strict";

const mapobj = (obj, fn) => {
    const exported = {};

    for (const name of Object.keys(obj)) {
        exported[name] = fn(obj[name], name, obj);
    }

    return exported;
};

module.exports = {
    mapobj
};
