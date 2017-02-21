"use strict";

const ko = require("knockout");
const $ = require("jquery");
const utils = require("lib/utils");
const stat = require("lib/status");
const api = require("api.io-client");

model.nodepath = params.nodepath;
model.active = ko.observable(false);
model.fileInput = ko.observableArray();

model.files = ko.asyncComputed([], async () => {
    let files = [];

    for (let file of model.fileInput()) {
        files.push({
            uploadId: await api.vfs.allocateUploadId(),
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
}, (error) => {
    stat.printError(error);
    return [];
});

model.dragNoopHandler = (element, event) => {
    event.stopPropagation();
    event.preventDefault();
};

model.dropEventHandler = async (element, event) => {
    event.stopPropagation();
    event.preventDefault();

    console.log("files", event.originalEvent.dataTransfer.files);

    model.fileInput(event.originalEvent.dataTransfer.files);
};

model.selectHandler = (id) => {
    $("#" + id).trigger("click");
};

model.editable = ko.pureComputed(() => {
    if (!model.nodepath()) {
        return false;
    }

    return ko.unwrap(model.nodepath().editable);
});

model.finished = ko.pureComputed(() => {
    return model.files().filter((item) => item.complete()).length;
});

model.size = ko.pureComputed(() => {
    return model.files().reduce((pv, item) => pv + item.size, 0);
});

model.speed = ko.observable(0);

model.progress = ko.pureComputed(() => {
    let progress = model.files().reduce((pv, item) => pv + item.progress(), 0);

    return Math.round(progress / (model.files().length || 1));
});

model.import = async (abspath, item) => {
    let file = await api.file.mkfile(abspath, {
        name: item.name,
        _source: {
            uploadId: item.uploadId
        }
    });

    item.active(false);
    item.complete(true);

    console.log(item.name + " imported as " + abspath, item, file);
};

model.start = async () => {
    model.active(true);

    let delayed = [];
    let parentPath = model.nodepath().path + "/files";

    // Pass 1: Check duplicate names
    // TODO

    // Pass 2: Upload all files and import non-raw
    for (let item of model.files()) {
        item.active(true);
        item.failed(false);

        let result = await utils.upload("/file/upload/" + item.uploadId, item.file, (progress, speed) => {
            item.progress(progress);
            model.speed(speed);
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
            let name = await api.node.getUniqueName(parentPath, item.name);
            await model.import(parentPath + "/" + name, item);
        }
    }

    console.log("First run of files imported, " + delayed.length + " files delayed");

    let parent = await api.vfs.resolve(parentPath);
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

            await api.vfs.ensure(versionPath, "d");

            let name = await api.node.getUniqueName(versionPath, file.item.name);

            await model.import(versionPath + "/" + name, file.item);
        } else {
            let name = await api.node.getUniqueName(parentPath, file.item.name);
            await model.import(parentPath + "/" + name, file.item);
        }
    }


    model.active(false);
    stat.printSuccess("Uploaded " + model.files().length + " files successfully!");
    model.fileInput([]);
};
