"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const status = require("lib/status");
const node = require("lib/node");
const api = require("api.io-client");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.files = ko.observableArray();
    this.active = ko.observable(false);

    this.editable = ko.pureComputed(() => {
        if (!this.nodepath()) {
            return false;
        }

        return ko.unwrap(this.nodepath().editable);
    });

    this.finished = ko.pureComputed(() => {
        return this.files().filter((item) => item.complete()).length;
    });

    this.size = ko.pureComputed(() => {
        return this.files().reduce((pv, item) => pv + item.size, 0);
    });

    this.speed = ko.observable(0);

    this.progress = ko.pureComputed(() => {
        let progress = this.files().reduce((pv, item) => pv + item.progress(), 0);

        return Math.round(progress / (this.files().length || 1));
    });

    this.start = utils.co(function*() {
        let item;

        this.active(true);

        try {
            for (item of this.files()) {
                item.active(true);
                item.failed(false);

                let result = yield utils.upload("/upload/" + item.uploadId, item.file, (progress, speed) => {
                    item.progress(progress);
                    this.speed(speed);
                });

                if (result.status !== "success") {
                    throw new Error("Status was not success but " + result.status);
                }

                let abspath = this.nodepath().path + "/files/" + item.name.replace(/ |\//g, "_");

                let file = yield api.file.mkfile(abspath, {
                    name: item.name,
                    _source: {
                        uploadId: item.uploadId
                    }
                });

                item.active(false);
                item.complete(true);

                console.log(item.name + " uploaded", item, result, file);
            }
        } catch (e) {
            item.active(false);
            item.failed(true);
            status.printError(e);
        }

        this.active(false);
        params.files.removeAll();
        node.reload();
    }.bind(this));

    this.close = () => {
        params.files.removeAll();
    };

    if (this.editable()) {
        console.log("FILES!", ko.unwrap(params.files));

        for (let file of params.files()) {
            let item = {
                uploadId: yield api.vfs.allocateUploadId(),
                progress: ko.observable(0),
                size: file.size,
                name: file.name,
                active: ko.observable(false),
                complete: ko.observable(false),
                failed: ko.observable(false),
                file: file
            };

            this.files.push(item);
        }
    }

    this.dispose = () => {
    };
});
