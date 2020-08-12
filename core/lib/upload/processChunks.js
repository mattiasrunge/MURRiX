"use strict";

const path = require("path");
const { v4: uuid } = require("uuid");
const Deferred = require("../lib/Deferred");
const utils = require("./utils");
const assembleChunks = require("./assebleChunks");
const importFile = require("./importFile");

const checks = {};

const processChunks = async (client, tmpdir, targetdir, name, identifier, numberOfChunks, abspath) => {
    checks[identifier] = checks[identifier] ?? new Deferred(true);
    const current = checks[identifier];
    const my = checks[identifier] = new Deferred();

    const finished = await current.promise;

    try {
        if (finished) {
            // A previous check has already assembled the file
            my.resolve(true);
        } else {
            const complete = await utils.isComplete(tmpdir, identifier, numberOfChunks);

            if (complete) {
                const filename = path.join(targetdir, uuid());

                await assembleChunks(tmpdir, identifier, numberOfChunks, filename);

                // We have assembled the file
                my.resolve(true);

                await importFile(client, name, filename, abspath);
            } else {
                // The file is not yet complete
                my.resolve(false);
            }
        }
    } finally {
        if (checks[identifier] === my) {
            delete checks[identifier];
        }
    }
};

module.exports = processChunks;
