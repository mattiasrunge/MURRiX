"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
    this.name = ko.pureComputed(() => ko.unwrap(params.name));
    this.niceName = ko.pureComputed(() => ko.unwrap(params.niceName));
    this.searchPaths = ko.pureComputed(() => ko.unwrap(params.searchPaths));
    this.editing = ko.observable(false);
    this.linkToPath = ko.observable(false);

    this.item = ko.asyncComputed(false, function*(setter) {
        let abspath = this.nodepath().path + "/" + this.name();

        setter(false);

        let item = yield api.vfs.resolve(abspath, { noerror: true });

        console.log(abspath, item);

        if (!item) {
            return false;
        }

        abspath = yield api.vfs.lookup(item._id);

        this.linkToPath(abspath);

        return { node: ko.observable(item), path: abspath };
    }.bind(this), (error) => {
        stat.printError(error);
        return false;
    });

    let subscription = this.linkToPath.subscribe((value) => {
        if (!this.editing()) {
            return;
        }

        console.log(value);
        this.editing(false);

        // TODO:
    });

    this.dispose = () => {
        subscription.dispose();
        stat.destroy(this.loading);
    };
});
