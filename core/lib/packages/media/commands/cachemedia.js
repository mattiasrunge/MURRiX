"use strict";

const media = require("../../../media");
const url = require("./url");
const syncmedia = require("./syncmedia");

module.exports = async (client, abspath) => {
    for (const size of media.requiredSizes) {
        await url(client, abspath, {
            width: size.width,
            height: size.height,
            type: size.type
        });
    }

    await syncmedia(client, abspath);
};
