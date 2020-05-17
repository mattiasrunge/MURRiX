"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs-extra");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../core/auth");
const config = require("../../../configuration");
const media = require("../../../media");
const log = require("../../../log")(module);
const syncmedia = require("./syncmedia");

const getExtensionByType = (type) => {
    if (type === "image") {
        return "jpg";
    } else if (type === "video" || type === "audio") {
        return "webm";
    } else if (type === "document") {
        return "pdf";
    } else if (type === "*") {
        return;
    }

    throw new Error(`Unknown format type, ${type}`);
};

const constructFilename = (id, format) => {
    const square = format.width === format.height ? 1 : 0;
    const extension = getExtensionByType(format.type);
    const height = format.height || 0;
    const width = format.width || 0;
    const angle = format.angle || 0;
    const mirror = format.mirror ? 1 : 0;

    return [
        id,
        "_w", width,
        "_h", height,
        "_s", square,
        "_a", angle,
        "_m", mirror,
        ".", extension
    ].join("");
};

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
            type: format.type || node.attributes.type,
            timeindex: node.attributes.timeindex
        };

        if (cacheformat.angle) {
            cacheformat.angle = Number.parseInt(cacheformat.angle, 10);

            if (cacheformat.angle === 0 || Number.isNaN(cacheformat.angle)) {
                delete cacheformat.angle;
            } else if (![ 90, 180, 270 ].includes(Math.abs(cacheformat.angle))) {
                throw new Error("Valid angle values are: -270, -180, -90, 90, 180 and 270");
            }
        }

        if (cacheformat.timeindex === 0 || Number.isNaN(cacheformat.timeindex)) {
            delete cacheformat.timeindex;
        }

        let filepath = path.join(config.mcsDirectory, constructFilename(node._id, cacheformat));

        try {
            await fs.access(filepath);
        } catch {
            // Get cached name and create if not existing
            filepath = await media.getCached(node._id, filename, cacheformat);

            if (!filepath) {
                return null;
            }

            if (node.attributes.cached) {
                await syncmedia(client, node);
            }
        }

        // Return url
        return media.createCacheUrl(path.basename(filepath), node.attributes.name);
    } catch (error) {
        log.error(error, abspath, format);

        return null;
    }
};
