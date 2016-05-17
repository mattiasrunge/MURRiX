"use strict";

const ko = require("knockout");
const co = require("co");
const api = require("api.io-client");
const loc = require("lib/location");
const status = require("lib/status");

module.exports = {
    loading: status.create(),
    nodepath: ko.asyncComputed(false, function*(setter) {
        let path = ko.unwrap(loc.current().path);

        if (!path || path === "") {
            return false;
        }

        setter(false);

        module.exports.loading(true);
        let node = yield api.vfs.resolve(path, true)
        module.exports.loading(false);

        if (!node) {
            return false;
        }

        return { path: path, node: node };
    }.bind(this), (error) => {
        status.printError(error);
        return false;
    })
};
