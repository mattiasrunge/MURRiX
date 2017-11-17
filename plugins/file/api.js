"use strict";

const path = require("path");
const fs = require("fs-extra-promise");
const api = require("api.io");
const chron = require("chron-time");
const bus = require("../../core/lib/bus");
const log = require("../../core/lib/log")(module);
const merge = require("deepmerge");

let params = {};

const file = api.register("file", {
    deps: [ "vfs", "camera", "mcs", "auth", "lookup" ],
    init: async (config) => {
        params = config;
    },
    mkfile: api.export(async (session, abspath, attributes) => {
        attributes._source.filename = attributes._source.filename || path.join(params.uploadDirectory, attributes._source.uploadId);

        if (!(await fs.existsAsync(attributes._source.filename))) {
            throw new Error("Source file does not exist");
        }

        const metadata = await api.mcs.getMetadata(attributes._source.filename, {});

        if (attributes.sha1 && attributes.sha1 !== metadata.sha1) {
            throw new Error(`sha1 checksum for file does not match, is the file corrupt? ${attributes.sha1} !== ${metadata.sha1}`);
        }

        if (attributes.md5 && attributes.md5 !== metadata.md5) {
            throw new Error(`md5 checksum for file does not match, is the file corrupt? ${attributes.md5} !== ${metadata.md5}`);
        }

        await api.vfs.create(session, abspath, "f", attributes);
        await file.regenerate(session, abspath);

        await api.vfs.create(session, `${abspath}/tags`, "d");

        bus.emit("file.new", {
            uid: session.uid,
            path: abspath,
            type: attributes.type
        });

        return await api.vfs.resolve(session, abspath);
    }),
    regenerate: api.export(async (session, abspath, options = {}) => {
        let node = await api.vfs.resolve(session, abspath);

        // Update metadata
        const attributes = {};
        const metadata = await api.mcs.getMetadata(path.join(params.fileDirectory, node.attributes.diskfilename), { noChecksums: true });

        for (const key of Object.keys(metadata)) {
            if (key !== "raw" && key !== "name" && (typeof node.attributes[key] === "undefined" || options.overwrite)) {
                if (typeof node.attributes[key] === "object" && typeof metadata[key] === "object") {
                    attributes[key] = merge(node.attributes[key], metadata[key]);
                } else {
                    attributes[key] = metadata[key];
                }
            }
        }

        await api.vfs.setattributes(session, node, attributes);
        node = await api.vfs.resolve(session, abspath);

        // Update device
        let device = await api.vfs.resolve(session, `${abspath}/createdWith`, { noerror: true });

        if (node.attributes.deviceSerialNumber && !device) {
            device = (await api.vfs.list(session, "/cameras", {
                filter: {
                    "attributes.serialNumber": node.attributes.deviceSerialNumber }
            }))[0];

            if (device) {
                await api.vfs.symlink(session, device.path, `${abspath}/createdWith`);
                device = device.node;
            }
        }

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
                        const data = await api.lookup.getTimezoneFromPosition(session, node.attributes.where.latitude, node.attributes.where.longitude);

                        options.deviceUtcOffset = data.utcOffset;
                    }
                } else if (device.attributes.type === "offset_fixed") {
                    options.deviceUtcOffset = device.attributes.utcOffset;
                }

                options.deviceAutoDst = device.attributes.deviceAutoDst;
            }

            await api.vfs.setattributes(session, abspath, {
                time: chron.time2timestamp(source.time, options)
            });
        } else if (node.attributes.time) {
            await api.vfs.setattributes(session, abspath, {
                time: null
            });
        }

        await file.removeCached(session, abspath, "image");

        return await api.vfs.resolve(session, abspath);
    }),
    regenerateOther: api.export(async (/* session */) => {
        const cache = {};
        const nodes = await api.vfs.query(api.auth.getAdminSession(), {
            "attributes.type": "other"
        }, {
            fields: {
                "_id": 1
            }
        });

        for (const node of nodes) {
            const paths = await api.vfs.lookup(api.auth.getAdminSession(), node._id, cache);
            await api.file.regenerate(api.auth.getAdminSession(), paths[0]);
        }

        return nodes.length;
    }),
    removeCached: api.export(async (session, abspath, type) => {
        const node = await api.vfs.resolve(session, abspath);

        const list = await api.mcs.getAllCached(node._id, path.join(params.fileDirectory, node.attributes.diskfilename), type);

        for (const filename of list) {
            log.info(`Removing ${filename}...`);
            await fs.removeAsync(filename);
        }
    }),
    getFaces: api.export(async (session, abspath) => {
        const node = await api.vfs.resolve(session, abspath);

        return api.mcs.getFaces(path.join(params.fileDirectory, node.attributes.diskfilename));
    }),
    list: api.export(async (session, abspath, options = {}) => {
        const opts = {
            noerror: true,
            checkwritable: true,
            skip: options.skip,
            limit: options.limit,
            sort: options.sort,
            reverse: options.reverse,
            shuffle: options.shuffle
        };

        const list = await api.vfs.list(session, abspath, opts);

        if (options.image) {
            const ids = list.map((nodepath) => nodepath.node._id);

            const urls = await api.file.getMediaUrl(session, ids, options.image);

            for (const nodepath of list) {
                nodepath.filename = urls[nodepath.node._id] || false;
            }
        }

        return list;
    }),
    getMediaUrl: api.export(async (session, ids, format, requestId) => {
        format = format || {};

        if (typeof format.type === "undefined") {
            throw new Error("Missing type from format");
        }

        const idQuery = ids instanceof Array ? { $in: ids } : ids;
        const nodes = await api.vfs.query(session, {
            _id: idQuery
        }, {
            fields: {
                "attributes.name": 1,
                "attributes.type": 1,
                "attributes.diskfilename": 1,
                "attributes.angle": 1,
                "attributes.mirror": 1,
                "attributes.timeindex": 1
            }
        });
        let complete = 0;
        let timer = null;

        const notify = () => {
            complete++;

            if (requestId && !timer) {
                timer = setTimeout(() => {
                    console.log("media-progress", { requestId: requestId, total: nodes.length, complete: complete });
                    file.emit("media-progress", { requestId: requestId, total: nodes.length, complete: complete });
                    timer = null;
                }, 1000);
            }
        };

        let results = await Promise.all(nodes.map((node) => {
            return new Promise((resolve) => {
                api.mcs.getCached(node._id, path.join(params.fileDirectory, node.attributes.diskfilename), {
                    angle: node.attributes.angle,
                    mirror: node.attributes.mirror,
                    timeindex: node.attributes.timeindex,
                    width: format.width,
                    height: format.height,
                    type: format.type
                })
                    .then((filename) => {
                        notify();
                        resolve({ id: node._id, url: path.join("file", "media", path.basename(filename), node.attributes.name) });
                    })
                    .catch((error) => {
                        console.error("Failed to cache file", error); // TODO: Log event somewhere nicer
                        notify();
                        resolve(false);
                    });
            });
        }));

        results = results.filter((result) => result);

        const result = {};

        for (let n = 0; n < results.length; n++) {
            result[results[n].id] = results[n].url;
        }

        return ids instanceof Array ? result : (result[ids] || false);
    }),
    rotate: api.export(async (session, abspath, offset) => {
        const node = await api.vfs.resolve(session, abspath);

        if (!(await api.vfs.access(session, node, "w"))) {
            throw new Error("Permission denied");
        }

        offset = parseInt(offset, 10);

        if (node.attributes.mirror) {
            offset = -offset;
        }

        let angle = parseInt(node.attributes.angle || 0, 10) + offset;

        if (angle < 0) {
            angle += 360;
        } else if (angle > 270) {
            angle -= 360;
        }

        await file.removeCached(session, abspath, "image");

        return await api.vfs.setattributes(session, abspath, { angle: angle });
    })
});

module.exports = file;
