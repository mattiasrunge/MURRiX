"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.item = ko.asyncComputed(false, function*(setter) {
        setter(false);

        let path = params.path() + "/partner";
        let node = yield api.vfs.resolve(path, true, true);

        if (node && node.properties.type === "s") {
            path = node.attributes.path;
            node = yield api.vfs.resolve(path, false, true);
        } else {
            return false;
        }

        return { path: path, node: node };
    }.bind(this), (error) => {
        status.printError(error);
        return false;
    });

    this.dispose = () => {
    };
});
