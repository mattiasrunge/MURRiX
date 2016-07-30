"use strict";

/* TODO:
 * Allow drag and drop to set profile picture
 */

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.create();
    this.nodepath = params.nodepath;
    this.size = 224;

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
        result.files = yield api.people.findByTags(this.nodepath().path);
        this.loading(false);

        return result;
    }.bind(this), (error) => {
        this.loading(false);
        status.printError(error);
        return {
            files: [],
            texts: []
        };
    });

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
