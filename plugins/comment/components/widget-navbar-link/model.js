"use strict";

const ko = require("knockout");
const utils = require("lib/utils");
const api = require("api.io-client");
const status = require("lib/status");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(params) {
    this.path = params.path;
    this.loading = status.create();
    this.count = ko.asyncComputed([], function*() {
        let list = yield api.comment.list(ko.unwrap(this.path));
        return list.length;
    }.bind(this), (error) => {
        status.printError(error);
        return 0;
    });

    this.dispose = () => {
        status.destroy(this.loading);
    };
});

