"use strict";

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
        result.files = yield api.people.findByTags(this.nodepath().path);
        this.loading(false);

        result.files = result.files.map((file) => {
            file.node = ko.observable(file.node);
            return file;
        });

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
