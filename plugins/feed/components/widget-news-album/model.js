"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
    this.width = 155;
    this.height = 270;

    this.fileListPath = ko.pureComputed(() => this.nodepath() ? this.nodepath().node().attributes.path + "/files" : false);
    this.fileList = ko.nodepathList(this.fileListPath, { limit: 3, noerror: true });


    this.files = ko.asyncComputed([], function*(setter) {
        if (this.fileList().length === 0) {
            return [];
        }

        setter([]);

        this.loading(true);
        let filenames = yield api.file.getPictureFilenames(this.fileList().map((file) => file.node()._id), this.width, this.height);

        this.loading(false);

        let files = this.fileList().map((file) => {
            let filename = filenames.filter((filename) => filename.id === file.node()._id)[0];

            if (filename) {
                file.filename = filename.filename;
            }

            return file;
        });

        utils.sortNodeList(files);

        console.log("files", files);

        return files;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return [];
    });

    this.itemPath = ko.pureComputed(() => this.nodepath() ? this.nodepath().node().attributes.path : false);
    this.item = ko.nodepath(this.itemPath, { noerror: true });

    this.dispose = () => {
        this.fileList.dispose();
        this.item.dispose();
        stat.destroy(this.loading);
    };
});
