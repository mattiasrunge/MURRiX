"use strict";

const client = require("../client");
const p = require("path");
const path = require("../path");
const walk = require("walk-promise");
const checksum = require("bluebird").promisifyAll(require("checksum"));
const uploader = require("bluebird").promisifyAll(require("file-uploader"));

module.exports = {
    description: "Import files or directories from the file system",
    help: "Usage: import <fspath>",
    execute: function*(session, params) {
        let directories = new Set();
        let files = (yield walk(params.fspath))
        .filter((file) => file) // Filter out null object (unreadable)
        .map((file) => p.join(file.root, file.name).replace(p.dirname(params.fspath), ""))
        .map((file) => file[0] === "/" ? file.substr(1) : file);

        files.forEach((file) => directories.add(p.dirname(file)));
        directories = Array.from(directories).filter((dir) => dir !== "" && dir !== ".").sort();

        for (let directory of directories) {
            session.stdout().write("Importing directory " + directory + "...\n");

            yield client.call("create", {
                abspath: path.normalize(session.env("cwd"), directory.replace(/ /g, "_")),
                type: "d"
            });
        }

        for (let file of files) {
            session.stdout().write("Importing file " + file + "...\n");

            let filename = p.join(p.dirname(params.fspath), file);
            let uploadId = yield client.call("allocateuploadid");
            let options = {
                host: client.hostname,
                port: client.port,
                path: "/upload/" + uploadId,
                method: "POST"
            };

            let response = yield uploader.postFileAsync(options, filename, { });

            if (response.statusCode !== 200) {
                throw new Error("Failed to upload " + file);
            }

            yield client.call("create", {
                abspath: path.normalize(session.env("cwd"), file.replace(/ /g, "_")),
                type: "f",
                attributes: {
                    filename: p.basename(file),
                    sha1: yield checksum.fileAsync(filename),
                    _uploadId: uploadId
                }
            });
        }
    }
};
