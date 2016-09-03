"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
    this.size = 470;

    this.filename = ko.asyncComputed(false, function*(setter) {
        if (!this.item()) {
            return false;
        }

        setter(false);

        this.loading(true);

        let filename = yield api.file.getMediaUrl(this.item().node()._id, {
            width: this.size,
            type: "image"
        });

        console.log("filename", filename);

        this.loading(false);

        return filename;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return false;
    });

    this.itemPath = ko.pureComputed(() => this.nodepath() ? this.nodepath().node().attributes.path : false);
    this.item = ko.nodepath(this.itemPath, { noerror: true });

    this.dispose = () => {
        this.item.dispose();
        stat.destroy(this.loading);
    };
});
