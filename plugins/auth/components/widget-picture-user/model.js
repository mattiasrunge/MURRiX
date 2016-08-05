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

    this.item = ko.asyncComputed(false, function*(setter) {
        if (!this.uid()) {
            return false;
        }

        let item = false;

        setter(false);

        this.loading(true);

        let id = yield api.auth.picture(this.uid());

        if (id) {
            item = (yield api.file.getPictureFilenames([ id ], this.size, this.size))[0];
        }

        this.loading(false);

        return item;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return false;
    });

    this.dispose = () => {
        stat.destroy(this.loading);
    };
});
