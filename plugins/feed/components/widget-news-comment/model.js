"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
    this.size = 620;

     this.item = ko.asyncComputed(false, function*(setter) {
        if (!this.nodepath()) {
            return false;
        }

        let item = false;

        setter(false);

        this.loading(true);

        let node = yield api.vfs.resolve(this.nodepath().node().attributes.path, true);

        if (node) {
            item = (yield api.file.getPictureFilenames([ node._id ], this.size))[0];
        }

        console.log(item);

        this.loading(false);

        return item;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return false;
    });

    this.dispose = () => {
        stat.destroy(this.loading);
    };
});
