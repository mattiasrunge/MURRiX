"use strict";

const path = require("path");
const fs = require("fs-extra-promise");
const api = require("api.io");
const chron = require("chron-time");
const bus = require("../../core/lib/bus");

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

        let metadata = await api.mcs.getMetadata(attributes._source.filename, {});

        if (attributes.sha1 && attributes.sha1 !== metadata.sha1) {
            throw new Error("sha1 checksum for file does not match, is the file corrupt? " + attributes.sha1 + " !== " + metadata.sha1);
        }

        if (attributes.md5 && attributes.md5 !== metadata.md5) {
            throw new Error("md5 checksum for file does not match, is the file corrupt? " + attributes.md5 + " !== " + metadata.md5);
        }

        await api.vfs.create(session, abspath, "f", attributes);
        await file.regenerate(session, abspath);

        await api.vfs.create(session, abspath + "/tags", "d");

        bus.emit("file.new", {
            uid: session.uid,
            path: abspath,
            type: attributes.type
        });

        return await api.vfs.resolve(session, abspath);
    }),
    regenerate: api.export(async (session, abspath) => {
        let node = await api.vfs.resolve(session, abspath);



        // Update metadata
        let attributes = {};
        let metadata = await api.mcs.getMetadata(path.join(params.fileDirectory, node.attributes.diskfilename), { noChecksums: true });

        for (let key of Object.keys(metadata)) {
            if (key !== "raw" && key !== "name" && typeof node.attributes[key] === "undefined") {
                attributes[key] = metadata[key];
            }
        }

        await api.vfs.setattributes(session, node, attributes);
        node = await api.vfs.resolve(session, abspath);



        // Update device
        let device = await api.vfs.resolve(session, abspath + "/createdWith", { noerror: true });

        if (node.attributes.deviceSerialNumber && !device) {
            device = (await api.vfs.list(session, "/cameras", {
                filter: {
                    "attributes.serialNumber": node.attributes.deviceSerialNumber }
            }))[0];

            if (device) {
                await api.vfs.symlink(session, device.path, abspath + "/createdWith");
                device = device.node;
            }
        }



        // Update time
        let source = chron.select(node.attributes.when || {});

        if (source) {
            let options = {
                type: source.type
            };

            if (source.type === "device" && device) {
                if (device.attributes.type === "offset_relative_to_position") {
                    options.deviceUtcOffset = 0;

                    if (node.attributes.where.longitude && node.attributes.where.latitude) {
                        let data = await api.lookup.getTimezoneFromPosition(session, node.attributes.where.latitude, node.attributes.where.longitude);

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
        } else if (node.attributes.time){
            await api.vfs.setattributes(session, abspath, {
                time: null
            });
        }

        return await api.vfs.resolve(session, abspath);
    }),
    regenerateOther: api.export(async (/*session*/) => {
        let cache = {};
        let nodes = await api.vfs.query(api.auth.getAdminSession(), {
            "attributes.type": "other"
        }, {
            fields: {
                "_id": 1
            }
        });

        for (let node of nodes) {
            let paths = await api.vfs.lookup(api.auth.getAdminSession(), node._id, cache);
            await api.file.regenerate(api.auth.getAdminSession(), paths[0]);
        }

        return nodes.length;
    }),
    getFaces: api.export(async (session, abspath) => {
        let node = await api.vfs.resolve(session, abspath);

        return api.mcs.getFaces(path.join(params.fileDirectory, node.attributes.diskfilename));
    }),
    getMediaUrl: api.export(async (session, ids, format, requestId) => {
        format = format || {};

        if (typeof format.type === "undefined") {
            throw new Error("Missing type from format");
        }

        let idQuery = ids instanceof Array ? { $in: ids } : ids;
        let nodes = await api.vfs.query(session, {
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

        let result = {};

        for (let n = 0; n < results.length; n++) {
            result[results[n].id] = results[n].url;
        }

        return ids instanceof Array ? result : (result[ids] || false);
    }),
    rotate: api.export(async (session, abspath, offset) => {
        let node = await api.vfs.resolve(session, abspath);

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

        return await api.vfs.setattributes(session, abspath, { angle: angle });
    })
});

module.exports = file;
