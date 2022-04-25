"use strict";

const path = require("path");
const { v4: uuid } = require("uuid");
const Deferred = require("../lib/Deferred");
const utils = require("./utils");
const assembleChunks = require("./assebleChunks");
const importFile = require("./importFile");

const checks = {};

const processChunks = async (client, tmpdir, targetdir, name, identifier, numberOfChunks, abspath) => {
    console.log("process chunks start")
    console.log(" - tmpdir:", tmpdir);
    console.log(" - targetdir:", targetdir);
    console.log(" - name:", name);
    console.log(" - identifier:", identifier);
    console.log(" - numberOfChunks:", numberOfChunks);
    console.log(" - abspath:", abspath);
    checks[identifier] = checks[identifier] ?? new Deferred(true);
    const current = checks[identifier];
    const my = checks[identifier] = new Deferred();

    const finished = await current.promise;
    console.log(" - finished:", finished);
    try {
        if (finished) {
            // A previous check has already assembled the file
            my.resolve(true);
        } else {
            const complete = await utils.isComplete(tmpdir, identifier, numberOfChunks);
            console.log(" - complete:", complete);
            if (complete) {
                const filename = path.join(targetdir, uuid());

                console.log(" - filename:", filename);
                await assembleChunks(tmpdir, identifier, numberOfChunks, filename);
                console.log("after assemble");

                // We have assembled the file
                my.resolve(true);

                console.log("before importFile");
                await importFile(client, name, filename, abspath);
                console.log("after importFile");
            } else {
                // The file is not yet complete
                my.resolve(false);
            }
        }
    } finally {
        if (checks[identifier] === my) {
            delete checks[identifier];
        }

        console.log("process chunks end")
    }
};

module.exports = processChunks;
