"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.create();
    this.nodepath = params.nodepath;
    this.section = params.section;

    this.count = ko.asyncComputed(-1, function*(setter) {
        if (!this.nodepath()) {
            return [];
        }

        setter([]);

        let filesNode = yield api.vfs.resolve(this.nodepath().path + "/files");
        return filesNode.properties.children.length;
    }.bind(this), (error) => {
        status.printError(error);
        return -1;
    });

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
