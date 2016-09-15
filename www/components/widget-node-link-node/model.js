"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

model.loading = stat.create();
model.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
model.initial = ko.pureComputed(() => ko.unwrap(params.initial) || "");
model.name = ko.pureComputed(() => ko.unwrap(params.name));
model.placeholder = ko.pureComputed(() => ko.unwrap(params.placeholder));
model.searchPaths = ko.pureComputed(() => ko.unwrap(params.searchPaths));
model.editing = ko.observable(false);
model.linkToPath = ko.observable(false);

model.item = ko.asyncComputed(false, function*(setter) {
    let abspath = model.nodepath().path + "/" + model.name();

    setter(false);

    let link = yield api.vfs.resolve(abspath, { noerror: true, nofollow: true });

    if (!link) {
        return false;
    }

    let item = yield api.vfs.resolve(link.attributes.path);

    model.linkToPath(link.attributes.path);

    return { node: ko.observable(item), path: link.attributes.path };
}, (error) => {
    stat.printError(error);
    return false;
});

let save = utils.co(function*(targetpath) {
    if (model.item() && targetpath === model.item().path) {
        return;
    }

    let abspath = model.nodepath().path + "/" + model.name();

    yield api.vfs.unlink(abspath);

    if (targetpath) {
        yield api.vfs.symlink(targetpath, abspath);
    }

    model.item.reload();
});

let subscription = model.linkToPath.subscribe((value) => {
    if (!model.editing()) {
        return;
    }

    model.editing(false);

    save(value)
    .catch((error) => {
        stat.printError(error);
    });
});

const dispose = () => {
    subscription.dispose();
    stat.destroy(model.loading);
};
