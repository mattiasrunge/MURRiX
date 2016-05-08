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

        let files = yield api.vfs.list(this.path() + "/files"); // TODO: Sort
        let list = yield api.file.getPictureFilenames(files.map((file) => file.node._id), this.size, this.size);

        console.log(list);

        this.loading(false);

        return list;
    }.bind(this), (error) => {
        this.loading(false);
        status.printError(error);
        return [];
    });

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
