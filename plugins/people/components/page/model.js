"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.section = params.section;
    this.loading = stat.create();

    this.metrics = ko.asyncComputed([], function*(setter) {
        if (!this.nodepath() || this.nodepath() === "") {
            return {};
        }

        setter({});

        this.loading(true);
        let metrics = yield api.people.getMetrics(this.nodepath().path);
        this.loading(false);

        console.log("metrics", metrics);

        return metrics;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return {};
    });

    this.dispose = () => {
        stat.destroy(this.loading);
    };
});
