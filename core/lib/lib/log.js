"use strict";

const getLabel = (callingModule) => {
    const filename = typeof callingModule === "string" ? callingModule : callingModule.filename;
    const [ name, dirname ] = filename.split("/").reverse();

    return `${dirname}/${name}`;
};

let level = "debug";

module.exports = (callingModule) => {
    const label = getLabel(callingModule);
    const print = (level, msg, ...args) => {
        // eslint-disable-next-line no-console
        console.log(`${new Date().toISOString()} - ${level}: [${label}] ${msg}`, ...args);
    };

    return {
        print: (level, msg, ...args) => {
            // eslint-disable-next-line no-console
            console.log(`${new Date().toISOString()} - ${level}: [${label}] ${msg}`, ...args);
        },
        info: (...args) => print("info", ...args),
        error: (...args) => print("error", ...args),
        debug: (...args) => print("debug", ...args),
        profile: (...args) => print("profile", ...args)
    };
};

module.exports.init = (l) => {
    level = typeof l === "string" ? l : level;

    return Promise.resolve();
};
