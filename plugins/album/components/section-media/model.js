"use strict";

/* TODO:
 * Allow drag and drop to set profile picture
 */

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.nodepath = params.nodepath;
    this.size = 226;

    this.data = ko.asyncComputed([], function*(setter) {
        let result = {
            files: [],
            texts: []
        };

        if (!this.nodepath()) {
            return result;
        }

        setter(result);

        this.loading(true);
        result.files = yield api.vfs.list(this.nodepath().path + "/files");
        result.texts = yield api.vfs.list(this.nodepath().path + "/texts");
        this.loading(false);

        return result;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return {
            files: [],
            texts: []
        };
    });

    this.dispose = () => {
        stat.destroy(this.loading);
    };
});
