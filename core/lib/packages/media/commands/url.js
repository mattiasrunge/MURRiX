"use strict";

const assert = require("assert");
const path = require("path");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../core/auth");
const config = require("../../../configuration");
const media = require("../../../media");
const syncmedia = require("./syncmedia");

module.exports = async (client, abspath, format) => {
    try {
        let c = client;

        // If logged in and request a user profile picture allow
        if (typeof abspath === "string" && !client.isGuest() && abspath.startsWith("/users")) {
            c = ADMIN_CLIENT;
        }

        const node = await Node.resolve(c, abspath);
        const filename = path.join(config.fileDirectory, node.attributes.diskfilename);

        assert(node.properties.type === "f", "Can only get media for files");

        // Define format for cache request
        const cacheformat = {
            angle: format.angle || node.attributes.angle,
            mirror: format.mirror || node.attributes.mirror,
            width: format.width,
            height: format.height,
            type: format.type || node.attributes.type
        };

        // Get cached name and create if not existing
        const cached = await media.getCached(node._id, filename, {
            timeindex: node.attributes.timeindex,
            ...cacheformat
        });

        if (!cached) {
            return null;
        }

        if (node.attributes.cached) {
            await syncmedia(client, node);
        }

        // Return url
        return media.createCacheUrl(path.basename(cached), node.attributes.name);
    } catch (error) {
        return null;
    }
};
