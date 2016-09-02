"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const fs = require("fs-extra-promise");
const api = require("api.io");
const chron = require("chron-time");
const bus = require("../../core/lib/bus");

let params = {};

let file = api.register("file", {
    deps: [ "vfs", "camera", "mcs" ],
    init: co(function*(config) {
        params = config;
    }),
    mkfile: function*(session, abspath, attributes) {
        attributes._source.filename = attributes._source.filename || path.join(params.uploadDirectory, attributes._source.uploadId);

        if (!(yield fs.existsAsync(attributes._source.filename))) {
            throw new Error("Source file does not exist");
        }

        let metadata = yield api.mcs.getMetadata(attributes._source.filename, { noChecksums: true }); // TODO: checksum

        //         if (attributes.sha1 && attributes.sha1 !== metadata.sha1) {
        //             throw new Error("sha1 checksum for file does not match, is the file corrupt? " + attributes.sha1 + " !== " + metadata.sha1);
        //         }

        //         if (attributes.md5 && attributes.md5 !== metadata.md5) {
        //             throw new Error("md5 checksum for file does not match, is the file corrupt? " + attributes.md5 + " !== " + metadata.md5);
        //         }

        for (let key of Object.keys(metadata)) {
            if (key !== "raw" && key !== "name" && typeof attributes[key] === "undefined") {
                attributes[key] = metadata[key];
            }
        }

        yield api.vfs.create(session, abspath, "f", attributes);
        yield file.regenerate(session, abspath);

        yield api.vfs.create(session, abspath + "/tags", "d");

        bus.emit("file.new", {
            uid: session.uid,
            path: abspath,
            type: attributes.type
        });

        return yield api.vfs.resolve(session, abspath);
    },
    regenerate: function*(session, abspath) {
        let node = yield api.vfs.resolve(session, abspath);

        let device = yield api.vfs.resolve(session, abspath + "/createdWith", { noerror: true });

        if (node.attributes.deviceSerialNumber && !device) {
            device = (yield api.vfs.list(session, "/cameras", {
                filter: {
                    "attributes.serialNumber": node.attributes.deviceSerialNumber }
            }))[0];

            if (device) {
                yield api.vfs.symlink(session, device.path, abspath + "/createdWith");
                device = device.node;
            }
        }

        let source = chron.select(node.attributes.when || {});

        if (source) {
            let options = {
                type: source.type
            };

            if (source.type === "device" && device) {
                if (device.attributes.type === "offset_relative_to_position") {
                    options.deviceUtcOffset = 0;

                    if (node.attributes.where.longitude && node.attributes.where.latitude) {
                        let data = yield api.lookup.getTimezoneFromPosition(session, node.attributes.where.latitude, node.attributes.where.longitude);

                        options.deviceUtcOffset = data.utcOffset;
                    }
                } else if (device.attributes.type === "offset_fixed") {
                    options.deviceUtcOffset = device.attributes.utcOffset;
                }

                options.deviceAutoDst = device.attributes.deviceAutoDst;
            }

            let timestamp = chron.time2timestamp(source.time, options);

            yield api.vfs.setattributes(session, node, {
                time: timestamp
            });
        }

        return yield api.vfs.resolve(session, abspath);
    },
    getFaces: function*(session, abspath) {
        let node = yield api.vfs.resolve(session, abspath);

        return api.mcs.getFaces(path.join(params.fileDirectory, node.attributes.diskfilename));
    },
    getMediaUrl: function*(session, ids, format) {
        format = format || {};

        if (typeof format.type === "undefined") {
            throw new Error("Missing type from format");
        }

        if (format.type === "image" || format.type === "video") {
            if (typeof format.width === "undefined") {
                throw new Error("Missing width from format");
            }

            if (typeof format.height === "undefined") {
                throw new Error("Missing height from format");
            }
        }

        let idQuery = ids instanceof Array ? { $in: ids } : ids;
        let nodes = yield api.vfs.query(session, {
            _id: idQuery
        }, {
            fields: {
                "attributes.type": 1,
                "attributes.diskfilename": 1,
                "attributes.angle": 1,
                "attributes.mirror": 1,
                "attributes.timeindex": 1
            }
        });

        let results = yield Promise.all(nodes.map((node) => {
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
                    resolve({ id: node._id, url: path.join("file", "media", path.basename(filename)) });
                })
                .catch((error) => {
                    console.log(error); // TODO: Log event somewhere nicer
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
    },

    getPictureFilenames: function*(session, ids, width, height) {
        let nodes = yield api.vfs.query(session, {
            _id: { $in: ids }
        }, {
            fields: {
                "attributes.type": 1,
                "attributes.diskfilename": 1,
                "attributes.angle": 1,
                "attributes.mirror": 1,
                "attributes.timeindex": 1
            }
        });

        let filenames = yield Promise.all(nodes.map((node) => {
            return new Promise((resolve) => {
                api.mcs.getCached(node._id, path.join(params.fileDirectory, node.attributes.diskfilename), {
                    angle: node.attributes.angle,
                    mirror: node.attributes.mirror,
                    timeindex: node.attributes.timeindex,
                    width: width,
                    height: height,
                    type: "image"
                })
                .then(resolve)
                .catch((error) => {
                    console.log(error); // TODO: Log event somewhere nicer
                    resolve(false);
                });
            });
        }));

        let list = [];

        for (let n = 0; n < nodes.length; n++) {
            if (filenames[n]) {
                list.push({ id: nodes[n]._id, filename: path.join("file", "media", path.basename(filenames[n])) });
            }
        }

        return list;
    },
    getVideoFilenames: function*(session, ids, width, height) {
        let nodes = yield api.vfs.query(session, {
            _id: { $in: ids }
        }, {
            fields: {
                "attributes.type": 1,
                "attributes.diskfilename": 1,
                "attributes.angle": 1,
                "attributes.mirror": 1
            }
        });

        let filenames = yield Promise.all(nodes.map((node) => {
            if (node.attributes.type !== "image" && node.attributes.type !== "video") {
                return ""; // TODO:
            }

            return new Promise((resolve) => {
                api.mcs.getCached(node._id, path.join(params.fileDirectory, node.attributes.diskfilename), {
                    angle: node.attributes.angle,
                    mirror: node.attributes.mirror,
                    width: width,
                    height: height,
                    type: "video"
                })
                .then(resolve)
                .catch((error) => {
                    console.log(error); // TODO: Log event somewhere nicer
                    resolve(false);
                });
            });
        }));

        let list = [];

        for (let n = 0; n < nodes.length; n++) {
            list.push({ id: nodes[n]._id, filename: path.join("file", "media", path.basename(filenames[n])) });
        }

        return list;
    },
    getAudioFilenames: function*(session, ids) {
        let nodes = yield api.vfs.query(session, {
            _id: { $in: ids }
        }, {
            fields: {
                "attributes.type": 1,
                "attributes.diskfilename": 1
            }
        });

        let filenames = yield Promise.all(nodes.map((node) => {
            if (node.attributes.type !== "audio") {
                throw new Error("Item type for (node id = " + node._id + ") is not audio");
            }

            return new Promise((resolve) => {
                api.mcs.getCached(node._id, path.join(params.fileDirectory, node.attributes.diskfilename), {
                    type: "audio"
                })
                .then(resolve)
                .catch((error) => {
                    console.log(error); // TODO: Log event somewhere nicer
                    resolve(false);
                });
            });
        }));

        let list = [];

        for (let n = 0; n < nodes.length; n++) {
            list.push({ id: nodes[n]._id, filename: path.join("file", "media", path.basename(filenames[n])) });
        }

        return list;
    }
});

module.exports = file;
