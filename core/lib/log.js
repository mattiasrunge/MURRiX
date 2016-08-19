"use strict";

const winston = require("winston");

const getLabel = (callingModule) => {
    let filename = typeof callingModule === "string" ? callingModule : callingModule.filename;
    let parts = filename.split("/").reverse();
    return parts[1] + "/" + parts[0];
};
let loggers = [];
let level = "debug";
let silent = false;

module.exports = (callingModule) => {
    let log = new winston.Logger({
        transports: [
            new (winston.transports.Console)({
                name: "console",
                label: getLabel(callingModule),
                prettyPrint: true,
                timestamp: true,
                level: level,
                silent: silent
            })
        ]
    });

    loggers.push(log);

    return log;
};

module.exports.init = (l) => {
    level = typeof l === "string" ? l : level;
    silent = l === false;

    for (let log of loggers) {
        log.transports.console.level = level;
        log.transports.console.silent = silent;
    }

    return Promise.resolve();
};
