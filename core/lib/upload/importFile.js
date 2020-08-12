"use strict";

const { api } = require("../api");
const log = require("../lib/log")(module);

const importFile = async (client, niceName, filename, abspath) => {
    log.info(`Upload of file ${filename} completed successfully!`);

    const name = await api.uniquename(client, abspath, niceName);

    const node = await api.create(client, abspath, "f", name, {
        name: niceName,
        _source: {
            filename
        }
    });

    log.info(`Import of file ${filename} completed successfully at ${node.path} with id ${node._id}!`);
};

module.exports = importFile;
