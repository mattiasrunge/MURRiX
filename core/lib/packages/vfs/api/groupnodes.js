"use strict";

const { v4: uuid } = require("uuid");
const Node = require("../../../core/Node");

module.exports = async (client, abspaths, id = uuid()) => {
    for (const abspath of abspaths) {
        const node = await Node.resolve(client, abspath, { nofollow: true });

        await node.setGroup(client, id);
    }
};
