"use strict";

const walk = require("walk-promise");
const checksum = require("bluebird").promisifyAll(require("checksum"));
const uploader = require("bluebird").promisifyAll(require("file-uploader"));
const vorpal = require("../vorpal");
const session = require("../session");
const client = require("../client");
const vfs = require("../vfs");

vorpal
.command("import <fspath>", "Import files or directories from the file system")
.action(vorpal.wrap(function*(args) {
    let directories = new Set();
    let files = (yield walk(args.fspath))
    .filter((file) => file) // Filter out null object (unreadable)
    .map((file) => p.join(file.root, file.name).replace(p.dirname(args.fspath), ""))
    .map((file) => file[0] === "/" ? file.substr(1) : file);

    files.forEach((file) => directories.add(p.dirname(file)));
    directories = Array.from(directories).filter((dir) => dir !== "" && dir !== ".").sort();

    for (let directory of directories) {
        this.log("Importing directory " + directory + "...");

        yield client.call("create", {
            abspath: vfs.normalize(yield session.env("cwd"), directory.replace(/ /g, "_")),
            type: "d"
        });
    }

    for (let file of files) {
        this.log("Importing file " + file + "...");

        let filename = p.join(p.dirname(args.fspath), file);
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
            abspath: vfs.normalize(yield session.env("cwd"), file.replace(/ /g, "_")),
            type: "f",
            attributes: {
                filename: p.basename(file),
                sha1: yield checksum.fileAsync(filename),
                _uploadId: uploadId
            }
        });
    }
}));

