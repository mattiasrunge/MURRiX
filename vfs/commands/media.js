"use strict";

const assert = require("assert");
const path = require("path");
const Node = require("../lib/Node");
const { isGuest } = require("../lib/auth");
const config = require("../../lib/configuration");
const media = require("../../lib/media");
const { ADMIN_SESSION } = require("../lib/auth");
const syncmedia = require("./syncmedia");

module.exports = async (session, abspath, format) => {
    try {
        let sess = session;

        // If logged in and request a user profile picture allow
        if (typeof abspath === "string" && !isGuest(session) && abspath.startsWith("/users")) {
            sess = ADMIN_SESSION;
        }

        const node = await Node.resolve(sess, abspath);
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
            await syncmedia(session, node);
        }

        // Return url
        return media.createCacheUrl(path.basename(cached), node.attributes.name);
    } catch (error) {
        return null;
    }
};
