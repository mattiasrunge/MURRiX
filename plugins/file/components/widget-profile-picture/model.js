"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.path = ko.pureComputed(() => ko.unwrap(params.path));
    this.classes = ko.pureComputed(() => ko.unwrap(params.classes));
    this.size = params.size;
    this.nolazyload = params.nolazyload;

    this.picturePath = ko.pureComputed(() => this.path() + "/profilePicture");
    this.pictureNodePath = ko.nodepath(this.picturePath, { noerror: true });

    this.item = ko.asyncComputed(false, function*(setter) {
        if (!this.path() || this.path() === "") {
            return false;
        }

        let item = false;

        setter(false);

        this.loading(true);

        let node = this.pictureNodePath() ? this.pictureNodePath().node() : false;

        if (!node) {
            let files = yield api.vfs.list(this.path() + "/files", { noerror: true, limit: 1 });
            node = files.length > 0 ? files[0].node : false;
        }

        if (node) {
            item = (yield api.file.getPictureFilenames([ node._id ], this.size, this.size))[0];
        }

        this.loading(false);

        return item;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return false;
    });

    this.dispose = () => {
        this.pictureNodePath.dispose();
        stat.destroy(this.loading);
    };
});
