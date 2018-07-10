"use strict";

const assert = require("assert");
const Node = require("../lib/Node");
const access = require("./access");
const rmmedia = require("./rmmedia");
const metadata = require("./metadata");
const position2timezone = require("./position2timezone");
const symlink = require("./symlink");
const chron = require("chron-time");
const merge = require("deepmerge");
const { ADMIN_SESSION } = require("../lib/auth");

module.exports = async (session, abspath, options = {}) => {
    let node = await Node.resolve(session, abspath);

    assert(await access(session, node, "w"), "Permission denied");

    if (node.properties.type === "f") {
        const attributes = {};
        const meta = await metadata(session, abspath, { noChecksums: true });

        for (const key of Object.keys(meta)) {
            if (key !== "raw" && key !== "name" && (typeof node.attributes[key] === "undefined" || options.overwrite)) {
                if (typeof node.attributes[key] === "object" && typeof meta[key] === "object") {
                    attributes[key] = merge(node.attributes[key], meta[key]);
                } else {
                    attributes[key] = meta[key];
                }
            }
        }

        await node.update(session, attributes);
    }

    // Update device
    let device = null;

    try {
        device = await Node.resolve(session, `${node.path}/createdWith`);
    } catch (error) {
    }

    if (node.attributes.deviceSerialNumber && !device) {
        device = (await Node.list(ADMIN_SESSION, "/cameras", {
            query: {
                "attributes.serialNumber": node.attributes.deviceSerialNumber }
        }))[0];

        if (device) {
            await symlink(session, device.path, `${node.path}/createdWith`);
        }
    }

    // After symlink we must reread node!
    node = await Node.resolve(session, abspath);

    // Update time
    const source = chron.select(node.attributes.when || {});

    if (source) {
        const options = {
            type: source.type
        };

        if (source.type === "device" && device) {
            if (device.attributes.type === "offset_relative_to_position") {
                options.deviceUtcOffset = 0;

                if (node.attributes.where.longitude && node.attributes.where.latitude) {
                    const data = await position2timezone(session, node.attributes.where.latitude, node.attributes.where.longitude);

                    options.deviceUtcOffset = data.utcOffset;
                }
            } else if (device.attributes.type === "offset_fixed") {
                options.deviceUtcOffset = device.attributes.utcOffset;
            }

            options.deviceAutoDst = device.attributes.deviceAutoDst;
        }

        await node.update(session, {
            time: chron.time2timestamp(source.time, options)
        });
    } else if (node.attributes.time) {
        await node.update(session, {
            time: null
        });
    }

    if (node.properties.type === "f") {
        await rmmedia(session, node, "image");
        // TODO: await rmmedia(session, node, "video");
    }

    return node.serialize(session);
};
