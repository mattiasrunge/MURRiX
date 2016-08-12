"use strict";

const ko = require("knockout");
const $ = require("jquery");
const utils = require("lib/utils");
const stat = require("lib/status");
const node = require("lib/node");
const api = require("api.io-client");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.active = ko.observable(false);
    this.fileInput = ko.observableArray();

    this.files = ko.asyncComputed([], function*() {
        let files = [];

        for (let file of this.fileInput()) {
            files.push({
                uploadId: yield api.vfs.allocateUploadId(),
                progress: ko.observable(0),
                size: file.size,
                name: file.name,
                active: ko.observable(false),
                complete: ko.observable(false),
                failed: ko.observable(false),
                file: file
            });
        }

        return files;
    }.bind(this), (error) => {
        stat.printError(error);
        return [];
    });

    this.dragNoopHandler = (element, event) => {
        event.stopPropagation();
        event.preventDefault();
    };

    this.dropEventHandler = utils.co(function*(element, event) {
        event.stopPropagation();
        event.preventDefault();

        console.log("files", event.originalEvent.dataTransfer.files);

        this.fileInput(event.originalEvent.dataTransfer.files);
    }.bind(this));

    this.selectHandler = (id) => {
        $("#" + id).trigger("click");
    };

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
            stat.printError(e);
        }

        this.active(false);

        if (!item.failed()) {
            stat.printSuccess("Uploaded " + this.files().length + " files succesfully!");
            this.fileInput([]);
        }
    }.bind(this));

    this.dispose = () => {
    };
});
