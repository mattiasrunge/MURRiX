"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
    this.initial = ko.pureComputed(() => ko.unwrap(params.initial) || "");
    this.name = ko.pureComputed(() => ko.unwrap(params.name));
    this.placeholder = ko.pureComputed(() => ko.unwrap(params.placeholder));
    this.searchPaths = ko.pureComputed(() => ko.unwrap(params.searchPaths));
    this.editing = ko.observable(false);
    this.linkToPath = ko.observable(false);

    this.item = ko.asyncComputed(false, function*(setter) {
        let abspath = this.nodepath().path + "/" + this.name();

        setter(false);

        let link = yield api.vfs.resolve(abspath, { noerror: true, nofollow: true });

        if (!link) {
            return false;
        }

        let item = yield api.vfs.resolve(link.attributes.path);

        this.linkToPath(link.attributes.path);

        return { node: ko.observable(item), path: link.attributes.path };
    }.bind(this), (error) => {
        stat.printError(error);
        return false;
    });

    let save = utils.co(function*(targetpath) {
        if (this.item() && targetpath === this.item().path) {
            return;
        }

        let abspath = this.nodepath().path + "/" + this.name();

        yield api.vfs.unlink(abspath);

        if (targetpath) {
            yield api.vfs.symlink(targetpath, abspath);
        }

        this.item.reload();
    }.bind(this));

    let subscription = this.linkToPath.subscribe((value) => {
        if (!this.editing()) {
            return;
        }

        this.editing(false);

        save(value)
        .catch((error) => {
            stat.printError(error);
        });
    });

    this.dispose = () => {
        subscription.dispose();
        stat.destroy(this.loading);
    };
});
