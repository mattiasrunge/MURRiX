"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.create();
    this.path = params.path;
    this.size = params.size;

    this.list = ko.asyncComputed([], function*(setter) {
        if (!this.path() || this.path() === "") {
            return [];
        }

        setter([]);

        this.loading(true);

        let files = yield api.vfs.list(this.path() + "/files");
        let filenames = yield api.file.getPictureFilenames(files.map((file) => file.node._id), this.size, this.size);

        this.loading(false);

        files = files.map((file) => {
            let filename = filenames.filter((filename) => filename.id === file.node._id)[0];

            if (filename) {
                file.filename = filename.filename;
            }

            return file;
        });

        utils.sortNodeList(files)

        console.log("files", files);

        let texts = yield api.vfs.list(this.path() + "/texts");

        utils.sortNodeList(texts);


        // TODO
        return files;
    }.bind(this), (error) => {
        this.loading(false);
        status.printError(error);
        return [];
    });

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
