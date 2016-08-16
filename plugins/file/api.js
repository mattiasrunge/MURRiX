"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const fs = require("fs-extra-promise");
const api = require("api.io");
const plugin = require("../../core/lib/plugin");
const vfs = require("../vfs/api");
const mcs = require("../mcs/api");

let params = {};

let file = api.register("file", {
    deps: [ "vfs", "mcs", "camera" ],
    init: co(function*(config) {
        params = config;
    }),
    mkfile: function*(session, abspath, attributes) {
        attributes._source.filename = attributes._source.filename || path.join(params.uploadDirectory, attributes._source.uploadId);

        if (!(yield fs.existsAsync(attributes._source.filename))) {
            throw new Error("Source file does not exist");
        }

        let metadata = yield mcs.getMetadata(attributes._source.filename, { noChecksums: true }); // TODO: checksum

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

        yield vfs.create(session, abspath, "f", attributes);
        yield file.regenerate(session, abspath);

        yield vfs.create(session, abspath + "/tags", "d");

        plugin.emit("file.new", {
            uid: session.uid,
            path: abspath,
            type: attributes.type
        });

        return yield vfs.resolve(session, abspath);
    },
    regenerate: function*(session, abspath) {
        let node = yield vfs.resolve(session, abspath);
        let attributes = node.attributes;
        let device = yield vfs.resolve(session, abspath + "/createdWith", { noerror: true });

        if (attributes.deviceSerialNumber && !device) {
            device = (yield vfs.list(session, "/cameras", {
                filter: {
                    "attributes.serialNumber": attributes.deviceSerialNumber }
            }))[0];

            if (device) {
                yield vfs.symlink(session, device.path, abspath + "/createdWith");
                device = device.node;
            }
        }

        node = yield vfs.resolve(session, abspath);
        attributes = node.attributes;

        if (device && attributes.when && attributes.when.device) {
            attributes.when.device.deviceType = device.attributes.type;
            attributes.when.device.deviceUtcOffset = device.attributes.utcOffset;
            attributes.when.device.deviceAutoDst = device.attributes.deviceAutoDst;

            if (attributes.where.longitude && attributes.where.latitude) {
                attributes.when.device.longitude = attributes.where.longitude;
                attributes.when.device.latitude = attributes.where.latitude;
            }
        }

        yield vfs.setattributes(session, node, {
            time: yield mcs.compileTime(attributes.when || {})
        });
    },
    getFaces: function*(session, abspath) {
        let node = yield vfs.resolve(session, abspath);

        return mcs.getFaces(path.join(params.fileDirectory, node.attributes.diskfilename));
    },
    getPictureFilenames: function*(session, ids, width, height) {
        let nodes = yield vfs.query(session, {
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
            if (node.attributes.type !== "image" && node.attributes.type !== "video") {
                return ""; // TODO:
            }

            return new Promise((resolve) => {
                mcs.getCached(node._id, path.join(params.fileDirectory, node.attributes.diskfilename), {
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
                list.push({ id: nodes[n]._id, filename: path.join("media", path.basename(filenames[n])) });
            }
        }

        return list;
    },
    getVideoFilenames: function*(session, ids, width, height) {
        let nodes = yield vfs.query(session, {
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
                mcs.getCached(node._id, path.join(params.fileDirectory, node.attributes.diskfilename), {
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
            list.push({ id: nodes[n]._id, filename: path.join("media", path.basename(filenames[n])) });
        }

        return list;
    },
    getAudioFilenames: function*(session, ids) {
        let nodes = yield vfs.query(session, {
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
                mcs.getCached(node._id, path.join(params.fileDirectory, node.attributes.diskfilename), {
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
            list.push({ id: nodes[n]._id, filename: path.join("media", path.basename(filenames[n])) });
        }

        return list;
    }
});

module.exports = file;
