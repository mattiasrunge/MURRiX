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
    this.picture = ko.nodepath(this.picturePath, { noerror: true });

    this.profileUrl = ko.asyncComputed(undefined, function*(setter) {
        let id = false;

        setter(undefined);

        if (this.picture()) {
            id = this.picture().node()._id;
        } else {
            let nodepath = (yield api.vfs.list(this.path() + "/files", { noerror: true, limit: 1 }))[0];

            id = nodepath ? nodepath.node._id : false;
        }

        if (!id) {
            return false;
        }

        this.loading(true);

        let filename = yield api.file.getMediaUrl(id, {
            width: this.size,
            height: this.size,
            type: "image"
        });

        console.log("profileUrl", filename);

        this.loading(false);

        return filename;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return false;
    });

    this.dispose = () => {
        this.picture.dispose();
        stat.destroy(this.loading);
    };
});
