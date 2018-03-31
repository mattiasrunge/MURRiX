"use strict";

const path = require("path");
const Node = require("../lib/Node");
const { ADMIN_SESSION } = require("../lib/auth");
const config = require("../../core/lib/configuration");
const media = require("../../core/lib/media");

module.exports = async (session, abspath, format) => {
    try {
        const node = await Node.resolve(ADMIN_SESSION, abspath);
        const filename = path.join(config.fileDirectory, node.attributes.diskfilename);

        const cached = await media.getCached(node._id, filename, {
            angle: node.attributes.angle,
            mirror: node.attributes.mirror,
            timeindex: node.attributes.timeindex,
            width: format.width,
            height: format.height,
            type: format.type
        });

        if (!cached) {
            return null;
        }

        return media.createCacheUrl(path.basename(cached), node.attributes.name);
    } catch (error) {
        return null;
    }
};
