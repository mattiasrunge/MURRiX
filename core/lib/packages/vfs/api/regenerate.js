"use strict";

const assert = require("assert");
const chron = require("chron-time");
const merge = require("deepmerge");
const Node = require("../../../core/Node");
const { ADMIN_CLIENT } = require("../../../lib/auth");
const { api } = require("../../../api");

module.exports = async (client, abspath, options = {}) => {
    let node = await Node.resolve(client, abspath);

    assert(await api.access(client, node, "w"), "Permission denied");

    if (node.properties.type === "f") {
        const attributes = {};
        const meta = await api.metadata(client, abspath, { noChecksums: true });

        for (const key of Object.keys(meta)) {
            if (key !== "raw" && key !== "name" && (typeof node.attributes[key] === "undefined" || options.overwrite)) {
                if (typeof node.attributes[key] === "object" && typeof meta[key] === "object") {
                    attributes[key] = merge(node.attributes[key], meta[key]);
                } else {
                    attributes[key] = meta[key];
                }
            }
        }

        await node.update(client, attributes);
    }

    // Update device
    let device = null;

    try {
        device = await Node.resolve(client, `${node.path}/createdWith`);
    } catch {}

    if (node.attributes.deviceSerialNumber && !device) {
        device = (await Node.list(ADMIN_CLIENT, "/cameras", {
            query: {
                "attributes.serialNumber": node.attributes.deviceSerialNumber }
        }))[0];

        if (device) {
            await api.symlink(client, device.path, `${node.path}/createdWith`);
        }
    }

    // After symlink we must reread node!
    node = await Node.resolve(client, abspath);

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
                    const data = await api.position2timezone(client, node.attributes.where.latitude, node.attributes.where.longitude);

                    options.deviceUtcOffset = data.utcOffset;
                }
            } else if (device.attributes.type === "offset_fixed") {
                options.deviceUtcOffset = device.attributes.utcOffset;
            }

            options.deviceAutoDst = device.attributes.deviceAutoDst;
        }

        await node.update(client, {
            time: chron.time2timestamp(source.time, options)
        });
    } else if (node.attributes.time) {
        await node.update(client, {
            time: null
        });
    }

    if (node.properties.type === "f") {
        await api.rmmedia(client, node, "image");
        // TODO: await rmmedia(client, node, "video");
    }

    return node.serialize(client);
};
