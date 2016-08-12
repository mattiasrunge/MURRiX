"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.nodepath = params.nodepath;
    this.section = params.section;
    this.files = ko.observableArray();

    this.count = ko.asyncComputed(-1, function*(setter) {
        if (!this.nodepath()) {
            return [];
        }

        setter([]);

        let filesNode = yield api.vfs.resolve(this.nodepath().path + "/files");
        return filesNode.properties.children.length;
    }.bind(this), (error) => {
        stat.printError(error);
        return -1;
    });

    this.dispose = () => {
        stat.destroy(this.loading);
    };
});
