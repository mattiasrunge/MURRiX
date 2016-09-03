"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.uid = ko.pureComputed(() => ko.unwrap(params.uid) || false);
    this.size = params.size;
    this.classes = ko.pureComputed(() => ko.unwrap(params.classes) || "");

    this.filename = ko.asyncComputed(false, function*(setter) {
        if (!this.uid()) {
            return false;
        }

        let filename = false;

        setter(false);

        this.loading(true);

        let id = yield api.auth.picture(this.uid());

        if (id) {
            filename = yield api.file.getMediaUrl(id, {
                width: this.size,
                height: this.size,
                type: "image"
            });
        }

        this.loading(false);

        return filename;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return false;
    });

    this.dispose = () => {
        stat.destroy(this.loading);
    };
});
