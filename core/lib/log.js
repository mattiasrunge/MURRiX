"use strict";

const getLabel = (callingModule) => {
    let filename = typeof callingModule === "string" ? callingModule : callingModule.filename;
    let parts = filename.split("/").reverse();
    return parts[1] + "/" + parts[0];
};

let level = "debug";
let silent = false;

module.exports = (callingModule) => {
    const label = getLabel(callingModule);
    const print = (level, msg, ...args) => {
        console.log(`${new Date()} - ${level}: [${label}] ${msg}`, ...args);
    };

    return {
        print: (level, msg, ...args) => {
            console.log(`${new Date()} - ${level}: [${label}] ${msg}`, ...args);
        },
        info: (...args) => print("info", ...args),
        error: (...args) => print("error", ...args),
        debug: (...args) => print("debug", ...args),
        profile: (...args) => print("profile", ...args)
    };
};

module.exports.init = (l) => {
    level = typeof l === "string" ? l : level;
    silent = l === false;

    return Promise.resolve();
};
