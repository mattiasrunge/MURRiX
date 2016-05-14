"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const fs = require("fs-extra-promise");
const moment = require("moment");
const api = require("api.io");
const vfs = require("../vfs/api");
const auth = require("../auth/api");
const mcs = require("../mcs/api");

let params = {};

let file = api.register("file", {
    deps: [ "vfs", "auth", "mcs" ],
    init: co(function*(config) {
        params = config;
    }),
    mkfile: function*(session, abspath, attributes) {
        if (!(yield fs.existsAsync(attributes._source.filename))) {
            throw new Error("Source file does not exist");
        }

        let metadata = yield mcs.getMetadata(attributes._source.filename);

//         if (attributes.sha1 && attributes.sha1 !== metadata.sha1) {
//             throw new Error("sha1 checksum for file does not match, is the file corrupt? " + attributes.sha1 + " !== " + metadata.sha1);
//         }

//         if (attributes.md5 && attributes.md5 !== metadata.md5) {
//             throw new Error("md5 checksum for file does not match, is the file corrupt? " + attributes.md5 + " !== " + metadata.md5);
//         }

        if (metadata.deviceSerialNumber) {
            // TODO: find device
//             let device = yield vfs.query(session, { serialNumber: metadata.deviceSerialNumber })[0];
//
//             if (device) {
//
//             }
        }

        for (let key of Object.keys(metadata)) {
            if (key !== "raw" && key !== "name") {
                attributes[key] = metadata[key];
            }
        }

        let item = yield vfs.create(session, abspath, "f", attributes);

        yield vfs.create(session, abspath + "/tags", "d");

        return item;
    },
    getPictureFilenames: function*(session, ids, width, height) {
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

            return mcs.getCached(node._id, path.join(params.fileDirectory, node.attributes.diskfilename), {
                angle: node.attributes.angle,
                mirror: node.attributes.mirror,
                width: width,
                height: height,
                type: "image"
            });
        }));

        let list = [];

        for (let n = 0; n < nodes.length; n++) {
            list.push({ id: nodes[n]._id, filename: path.basename(filenames[n]) });
        }

        return list;
    }
});

module.exports = file;
