"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.create();
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
        status.printError(error);
        return -1;
    });

    this.dragNoopHandler = (element, event) => {
        event.stopPropagation();
        event.preventDefault();
    };

    this.dropEventHandler = (element, event) => {
        event.stopPropagation();
        event.preventDefault();

        console.log("files", event.originalEvent.dataTransfer.files);

        let files = [];

        for (let n = 0; n < event.originalEvent.dataTransfer.files.length; n++) {
            files.push(event.originalEvent.dataTransfer.files[n]);
        }

        node.uploadFiles(files);
    };

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
