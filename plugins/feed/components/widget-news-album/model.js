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

     this.files = ko.asyncComputed([], function*(setter) {
        if (!this.nodepath()) {
            return [];
        }

        setter([]);

        this.loading(true);
        let files = yield api.vfs.list(this.nodepath().node().attributes.path + "/files", { limit: 3 });
        let filenames = yield api.file.getPictureFilenames(files.map((file) => file.node._id), this.width, this.height);

        this.loading(false);

        files = files.map((file) => {
            let filename = filenames.filter((filename) => filename.id === file.node._id)[0];

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

    this.item = ko.asyncComputed(false, function*(setter) {
        if (!this.nodepath()) {
            return false;
        }

        setter(false);

        this.loading(true);
        let item = yield api.vfs.resolve(this.nodepath().node().attributes.path, { noerror: true });
        this.loading(false);

        console.log("item", item);

        return item;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return false;
    });

    let subscription = api.vfs.on("update", (data) => {
        if (data.path === this.nodepath().node().attributes.path) {
            this.item.reload();
        } else if (data.path === this.nodepath().node().attributes.path + "/files") {
            this.files.reload();
        }
    });

    this.dispose = () => {
        api.vfs.off(subscription);
        stat.destroy(this.loading);
    };
});
