"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));

    this.item = ko.asyncComputed(false, function*(setter) {
        if (!this.nodepath()) {
            return false;
        }

        setter(false);

        this.loading(true);
        let item = yield api.vfs.resolve(this.nodepath().node().attributes.path, { noerror: true });
        this.loading(false);

        console.log("item", item);

        return item;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return false;
    });

    let subscription = api.vfs.on("update", (data) => {
        if (data.path !== this.nodepath().node().attributes.path) {
            return;
        }

        this.item.reload();
    });

    this.dispose = () => {
        api.vfs.off(subscription);
        stat.destroy(this.loading);
    };
});
