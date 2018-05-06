"use strict";

const assert = require("assert");
const path = require("path");
const Node = require("../lib/Node");
const config = require("../../lib/configuration");
const media = require("../../lib/media");
const log = require("../../lib/log")(module);

module.exports = async (session, abspath) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "f", "Can only ensure cached for files");

    const filename = path.join(config.fileDirectory, node.attributes.diskfilename);

    if (!node.attributes.cached) {
        log.info(`No cached info found for ${node.path}, will try to build...`);
        const cached = await media.getAllCached(node._id, filename, "image", { format: true });

        await node.update(session, { cached });
    }

    for (const size of media.requiredSizes) {
        const format = {
            angle: node.attributes.angle,
            mirror: node.attributes.mirror,
            width: size.width,
            height: size.height,
            type: "image"
        };

        const existing = node.attributes.cached.find((c) => (
            c.angle === (format.angle || 0) &&
            c.mirror === !!format.mirror &&
            c.width === (format.width || 0) &&
            c.height === (format.height || 0) &&
            c.type === format.type
        ));

        if (!existing) {
            log.info(`${node.path} is missing cached for size ${JSON.stringify(size)}, will create`);
            await media.getCached(node._id, filename, {
                timeindex: node.attributes.timeindex,
                ...format
            });

            const cached = node.attributes.cached.slice(0).concat(format);

            await node.update(session, { cached });
        }
    }
};
