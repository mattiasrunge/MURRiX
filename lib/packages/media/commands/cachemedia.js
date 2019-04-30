"use strict";

const media = require("../../../media");
const mediaCmd = require("./url");
const syncmedia = require("./syncmedia");

module.exports = async (session, abspath) => {
    for (const size of media.requiredSizes) {
        await mediaCmd(session, abspath, {
            width: size.width,
            height: size.height,
            type: size.type
        });
    }

    await syncmedia(session, abspath);
};
