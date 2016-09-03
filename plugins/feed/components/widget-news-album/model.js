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

        let ids = this.fileList().map((file) => file.node()._id);

        this.loading(true);
        let filenames = yield api.file.getMediaUrl(ids, {
            width: this.width,
            height: this.height,
            type: "image"
        });


        this.loading(false);

        let files = this.fileList().map((file) => {
            file.filename = filenames[file.node()._id] || false;
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
