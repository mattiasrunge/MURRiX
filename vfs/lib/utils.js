"use strict";

const assert = require("assert");

const unpackObjectKeys = (obj) => {
    if (obj === null || typeof obj !== "object") {
        return obj;
    }

    const newObj = { ...obj };
    const keys = Object.keys(newObj);

    for (const key of keys) {
        if (typeof key === "string" && key.includes(".")) {
            const [ , k, rest ] = key.split(/(.*?)\.(.*)/);

            assert(!newObj[k] || typeof newObj[k] === "object", `${k} is not a key for an object, was: ${typeof newObj[k]} with value ${newObj[k]}`);

            newObj[k] = {
                ...(newObj[k] || {}),
                ...unpackObjectKeys({ [rest]: newObj[key] })
            };

            delete newObj[key];
        }
    }

    return newObj;
};

module.exports = {
    unpackObjectKeys
};
