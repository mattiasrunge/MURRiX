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

    this.import = utils.co(function*(abspath, item) {
        let file = yield api.file.mkfile(abspath, {
            name: item.name,
            _source: {
                uploadId: item.uploadId
            }
        });

        item.active(false);
        item.complete(true);

        console.log(item.name + " imported as " + abspath, item, file);
    }.bind(this));

    this.start = utils.co(function*() {
        this.active(true);

        let delayed = [];
        let parentPath = this.nodepath().path + "/files";

        // Pass 1: Check duplicate names
        // TODO

        // Pass 2: Upload all files and import non-raw
        for (let item of this.files()) {
            item.active(true);
            item.failed(false);

            let result = yield utils.upload("/file/upload/" + item.uploadId, item.file, (progress, speed) => {
                item.progress(progress);
                this.speed(speed);
            });

            if (result.status !== "success") {
                throw new Error("Status was not success but " + result.status + " for ", item);
            }

            console.log(result.metadata);

            if (result.metadata.rawImage) {
                delayed.push({
                    metadata: result.metadata,
                    item: item
                });
            } else {
                let name = yield node.getUniqueName(parentPath, item.name);
                yield this.import(parentPath + "/" + name, item);
            }
        }

        console.log("First run of files imported, " + delayed.length + " files delayed");

        let parent = yield api.vfs.resolve(parentPath);
        let children = [];
        for (let child of parent.properties.children) {
            let name = child.name.substr(0, child.name.lastIndexOf(".")) || child.name;
            children[name] = child;
        }


        // Pass 3: Import delayed (raw) files
        for (let file of delayed) {
            let basename = file.item.name.substr(0, file.item.name.lastIndexOf(".")) || file.item.name;

            if (children[basename]) {
                let versionPath = parentPath + "/" + children[basename].name + "/versions";

                yield api.vfs.ensure(versionPath, "d");

                let name = yield node.getUniqueName(versionPath, file.item.name);

                yield this.import(versionPath + "/" + name, file.item);
            } else {
                let name = yield node.getUniqueName(parentPath, file.item.name);
                yield this.import(parentPath + "/" + name, file.item);
            }
        }


        this.active(false);
        stat.printSuccess("Uploaded " + this.files().length + " files successfully!");
        this.fileInput([]);
    }.bind(this));

    this.dispose = () => {
    };
});
