"use strict";

const path = require("path");
const walk = require("walk-promise");
const fsAutocomplete = require("vorpal-autocomplete-fs");
const checksum = require("bluebird").promisifyAll(require("checksum"));
const uploader = require("bluebird").promisifyAll(require("file-uploader"));
const vorpal = require("../vorpal");
const session = require("../session");
const api = require("api.io").client;
const terminal = require("../terminal");

vorpal
.command("import <fspath>", "Import files or directories from the file system")
.autocomplete(fsAutocomplete())
.action(vorpal.wrap(function*(args) {
    let cwd = yield session.env("cwd");
    let directories = new Set();
    let files = (yield walk(args.fspath))
    .filter((file) => file) // Filter out null object (unreadable)
    .map((file) => path.join(file.root, file.name).replace(path.dirname(args.fspath), ""))
    .map((file) => file[0] === "/" ? file.substr(1) : file);

    files.forEach((file) => directories.add(path.dirname(file)));
    directories = Array.from(directories).filter((dir) => dir !== "" && dir !== ".").sort();

    for (let directory of directories) {
        this.log("Importing directory " + directory + "...");

        yield api.vfs.create(terminal.normalize(cwd, directory.replace(/ /g, "_")), "d");
    }

    for (let file of files) {
        this.log("Importing file " + file + "...");

        let filename = path.join(path.dirname(args.fspath), file);
        let uploadId = yield api.vfs.allocateUploadId();
        let options = {
            host: "localhost", // TODO
            port: 8080, // TODO
            path: "/upload/" + uploadId,
            method: "POST"
        };

        let response = yield uploader.postFileAsync(options, filename, { });

        if (response.statusCode !== 200) {
            throw new Error("Failed to upload " + file);
        }

        yield api.vfs.create(terminal.normalize(cwd, file.replace(/ /g, "_")), "f", {
            filename: path.basename(file),
            sha1: yield checksum.fileAsync(filename),
            _uploadId: uploadId
        });
    }
}));

