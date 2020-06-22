"use strict";

const { api } = require("../../../api");
const { size } = require("../../../lib/format");

module.exports = async (client, term,
    // List Dropbox folder
    opts // l List with details
) => {
    const list = await api.dropboxlist(client);

    if (!opts.l) {
        return term.writeln(list.map(({ name }) => name).join("  "));
    }

    const data = list.map((file) => ([
        file.name,
        size(file.size),
        file.id
    ]));

    term.writeTable(data);
};
